# ChiruDeli — Architecture

"Anything You Need. Delivered." — a four-sided delivery platform (Customer,
Business, Rider, Admin) for Chirundu, Zambia, built to expand to other towns
without code changes (service areas are data, not hardcoded logic).

## Monorepo layout

```
ChiruDeli/
  apps/
    api/                 Fastify + TypeScript backend (REST + Socket.io)
    customer-mobile/      Expo/React Native — fully implemented
    rider-mobile/         Expo/React Native — nav shell + placeholder screens
    business-web/         Next.js — store registration + manager dashboard, fully wired
    admin-web/             Next.js — store classes/approvals/managers + core admin, fully wired
  packages/
    design-tokens/         colors, type scale, spacing, radii, shadows, brand mark
    shared-types/           Zod schemas + enums — single source of truth for DTOs
    api-client/              typed fetch wrapper + React Query hooks + socket helpers
    config/                   shared tsconfig base
  docs/
    architecture.md         this file
    roadmap.md               what's real vs. what's next
```

Every frontend imports `@chirudeli/shared-types` for request/response shapes
and `@chirudeli/api-client` for talking to the API — none of them hand-roll
fetch calls or duplicate validation rules.

## Backend (`apps/api`)

- **Framework**: Fastify + TypeScript, CommonJS output (chosen over ESM to
  avoid Node's stricter extension-resolution rules while iterating fast with
  `tsx`).
- **Validation**: Zod schemas from `shared-types`, parsed at the route layer
  (`lib/validate.ts`) before hitting any service function.
- **ORM**: Prisma + PostgreSQL (Neon in dev). See `prisma/schema.prisma` for
  the full model set — identity/access, businesses/catalog, orders/delivery,
  payments/money, marketing/trust (promotions, reviews), platform/ops
  (delivery zones, fee config, notifications, audit log).
- **Auth**: JWT access (short-lived) + refresh (long-lived) tokens,
  `bcryptjs` password hashing. Customers can log in with phone+password or
  phone+OTP; store managers/rider/admin use phone+password. `AdminUser` has
  `twoFactorSecret`/`twoFactorEnabled` columns reserved for TOTP 2FA.
- **RBAC**: `UserRole` is `CUSTOMER | STORE_MANAGER | RIDER | SYSTEM_ADMIN`.
  Every route enforces its role server-side via `requireRole(...)`
  (`middleware/authenticate.ts`) — a `STORE_MANAGER` hitting an admin-only
  route gets a real 403, not just a hidden UI button. Store-scoped routes go
  one step further: `requireManagedBusiness(userId, businessId)`
  (`lib/storeAccess.ts`) verifies the authenticated manager actually has a
  `StoreManagerAssignment` for that business before returning anything —
  a client-supplied `businessId` is never trusted on its own. "My store"
  endpoints (`/manager/*`) don't even accept a business id from the client;
  they resolve it server-side via `getManagedBusinessId(userId)`.
- **Real-time**: Socket.io, attached to the same HTTP server Fastify uses.
  Rooms: `order:{orderId}` (status + rider location, joined by customer,
  business, assigned rider), `user:{userId}` (personal notifications),
  `rider:{riderId}` and `business:{businessId}` reserved for the rider/
  business apps' live request feeds (Phase 2), `admin:live` reserved for the
  admin live-ops view (Phase 3).
- **Idempotency**: `MasterOrder.idempotencyKey` is a unique column. The
  client generates a UUID once per checkout attempt and resends it on retry;
  `POST /orders` looks the key up first and returns the existing master order
  instead of creating a duplicate — this is what makes double-tapping
  "Place Order" or retrying after a dropped connection safe.

### Multi-store cart & order splitting

Customers never manage separate carts per store. `customer-mobile`'s
`cartStore` holds one flat structure — `stores: { businessId, businessName,
items }[]` — that items from any number of businesses accumulate into as the
customer browses. Nothing about adding an item ever clears or blocks on a
different store already being in the cart.

Checkout submits every item (each carrying its own `businessId`) in one
`POST /orders` call. The server groups them by business and, in a single
transaction:

```
MasterOrder                          ← what the customer sees/pays/tracks
  orderNumber e.g. "CD-260808-3UVQ"
  idempotencyKey, paymentMethod, paymentStatus
  subtotal / deliveryFee / serviceFee / discountAmount / total  (grand totals)
  ├─ Order ("store order") × N       ← what each business's dashboard sees
  │    orderNumber e.g. "CD-260808-3UVQ-01"
  │    businessId, items, subtotal, own status (PENDING_CONFIRMATION…DELIVERED)
  │    commissionPercent/commissionAmount/businessPayoutAmount (per store)
  ├─ Payment                          ← one charge for the grand total
  └─ MasterDelivery                   ← one rider, multi-stop route
       └─ DeliveryStop × (N pickups + 1 dropoff)
```

A business only ever queries its own `Order` rows — a store order has no
foreign key or join path back to another business's items, enforcing the
"a store must never see another store's data" rule at the schema level, not
just in application logic.

**Derived status, not stored**: `MasterOrder` has no `status` column.
`deriveOverallStatus()` (`orders.mapper.ts`) computes it from the store
orders every time it's read — the least-advanced non-cancelled store order's
status, or `DELIVERED`/`CANCELLED` once every store order agrees. This keeps
"what does the customer see" always consistent with the individual stores'
real progress without a separate field that could drift out of sync.

**Delivery fee**: `calculateMultiStoreDeliveryFee` (`lib/fees.ts`) starts
from the normal zone/distance fee to the customer's address and adds a flat
`MULTI_STORE_SURCHARGE_PER_EXTRA_STORE` (K10) per store beyond the first —
covers the rider's extra stops without customers doing per-store math.

**Pickup sequencing**: `sequencePickupStops` (`lib/fees.ts`) orders the
pickup stops **farthest-from-destination first**, so the rider's route
naturally converges toward the customer rather than zig-zagging. The
resulting `DeliveryStop` rows (`type: PICKUP`, one per store order, plus a
final `type: DROPOFF`) are strictly sequential — `completeDeliveryStop`
rejects completing a stop out of order, and completing the last pickup is
what allows the dropoff stop to be completed at all.

**Reviews**: one `Review` per store order (rates that business only) plus a
single rider rating on the `MasterOrder` itself — the rider handled every
pickup and the final delivery regardless of how many stores were involved,
so there's no sense rating them per-store.

### Store classes, approval workflow & RBAC

**Store classes are data, not an enum.** `StoreClass` (Restaurant, Pharmacy,
Hardware, ...) is a Prisma model the System Administrator manages entirely
from `admin-web` (`/store-classes`) — create/edit/deactivate/reorder, no code
change or deploy required. Each class owns its own
`StoreClassDocumentRequirement[]` (free-text labels like "Pharmacy Licence",
not a hardcoded document-type enum) — the store registration form
(`business-web`'s `/register`) renders upload fields dynamically from
whichever class the manager picks.

**Registration → approval → onboarding → activation** (`Business.status`):

```
DRAFT → SUBMITTED → PENDING_APPROVAL → UNDER_REVIEW → APPROVED
                            ↓ (admin)              ↓ (admin)
                        REJECTED              RESUBMISSION → PENDING_APPROVAL
APPROVED → SUSPENDED (admin, reversible)
APPROVED → DEACTIVATED (admin, terminal)
```

`POST /stores/register` creates a `User(STORE_MANAGER)` + `StoreManager`
profile + `Business(PENDING_APPROVAL)` + a `StoreManagerAssignment` in one
transaction — collecting personal info, store info, and store class in a
single submission (spec §3). The admin's review screen
(`admin-web`'s `/businesses/:id`) shows store info, the manager, and every
uploaded document with per-document approve/reject; `approve`/`reject`/
`request-changes` are only valid from `PENDING_APPROVAL`/`UNDER_REVIEW`/
`RESUBMISSION`, enforced server-side (`orders.service.ts`-style status guard
in `businesses.service.ts`).

**`isActivated` is deliberately separate from `status`** — a store can be
`APPROVED` but not yet activated. Customer visibility requires both
(`status === 'APPROVED' && isActivated`), matching spec §9/§10's "Approved
AND Active AND Not Suspended" rule with two independent facts instead of one
linear status. `POST /manager/store/activate` flips `isActivated` only once
`computeOnboarding()` reports every step complete: profile filled in,
opening hours set, at least one product category, at least one product,
at least one priced+available product, and every *required* document
`APPROVED` (spec §28's 7-step checklist, computed live — no stored step
number to drift out of sync).

**Suspension always wins.** `storeState` (`OPEN`/`PAUSED`) is still the
manager's own real-time "accepting orders" toggle, completely independent of
admin suspension — `PATCH /manager/store/open-status` rejects with 409 if
`status` is `SUSPENDED`/`DEACTIVATED`, so a suspended manager can't reopen
their own store (spec §29).

**Notifications + audit**: every status change
(`STORE_APPROVED`/`STORE_REJECTED`/`STORE_CHANGES_REQUESTED`/
`STORE_SUSPENDED`/`STORE_REACTIVATED`) fires a `createNotification()` to the
store's primary manager and a `recordAudit()` row, alongside the existing
order/business audit actions.

**Documents**: uploaded files are base64 content behind a
`DocumentStorageProvider` interface (`lib/documentStorage.ts`, same
swappable-provider pattern as `PaymentProvider`/`SmsProvider`) — the default
`PostgresBase64DocumentProvider` stores content directly on `StoreDocument`
rows so nothing is lost on a Render redeploy, with a one-file swap to real
object storage (S3/R2) once that's set up.

**Multiple managers per store, from day one**: `StoreManagerAssignment` is a
join table between `StoreManager` and `Business` (`isPrimary` flag), not a
direct `Business.ownerId` FK — today's flows create exactly one assignment
per store, but the schema already supports several managers sharing a store
or one manager running several, per spec §20, without another migration.

### Delivery fee & commission engine

```
apps/api/src/lib/distance.ts   DistanceProvider interface; Haversine impl
apps/api/src/lib/fees.ts       calculateDeliveryFee, calculateCommission,
                                 resolveZoneForCoordinates
```

```
resolveZoneForCoordinates(destination)
  → smallest-radius DeliveryZone whose circle contains the point
  → null means "outside every service area" → OutsideServiceAreaError
     (rendered client-side as "ChiruDeli is currently available in
     Chirundu. We're working on expanding to more areas.")

calculateDeliveryFee(zone, distanceKm, feeConfig)
  FIXED_ZONE  → zone.fixedFee                         (spec §18's table)
  DISTANCE_BASED → feeConfig.baseFee + distanceKm * feeConfig.perKmFee

calculateCommission(subtotal, commissionPercent)
  commissionPercent = business.commissionOverridePercent ?? platform default
  commissionAmount  = subtotal * commissionPercent / 100
  businessPayout    = subtotal - commissionAmount
```

Both the delivery fee and commission percent are **snapshotted onto the
Order** at creation time, so a later admin change to the global commission
or a zone's fee never rewrites historical orders' numbers.

### Order & delivery state machines

`Order.status` (customer-facing, drives the tracking screen):

```
PENDING_CONFIRMATION → CONFIRMED → PREPARING → READY_FOR_PICKUP
  → RIDER_ASSIGNED → PICKED_UP → ON_THE_WAY → DELIVERED
                 ↘ CANCELLED (only from a pre-PICKED_UP state)
```

Enforced by `assertValidOrderTransition` (`lib/orderStateMachine.ts`) — every
transition is checked against an explicit map, writes an `OrderStatusEvent`,
and broadcasts `order.status_changed` over Socket.io. Customer-initiated
cancellation is further restricted to `PENDING_CONFIRMATION`/`CONFIRMED`
(`canCustomerCancel`) — a configurable window, not a hardcoded rule.

`MasterDelivery.status` (rider-side, one row per master order):
`ASSIGNED → IN_PROGRESS → COMPLETED`. The finer-grained progress lives on its
`DeliveryStop` rows instead — `DeliveryStopStatus`: `PENDING → ARRIVED →
COMPLETED`, walked strictly in `sequence` order (see "Multi-store cart &
order splitting" above). A `deliveryPin` on `MasterDelivery` is required at
the final dropoff.

`PaymentStatus` (`UNPAID/PENDING/PAID/FAILED/REFUNDED`) is a fully separate
field from both of the above — a `CASH_ON_DELIVERY` order can be
`DELIVERED` while still `PENDING` until the rider collects cash, matching
the spec's explicit requirement that payment and delivery status never be
conflated.

### Provider interfaces (swap real services in without touching callers)

| Interface | Dev implementation | Swap in later |
|---|---|---|
| `DistanceProvider` | Haversine straight-line | Google Distance Matrix / OSRM |
| `PaymentProvider` | `CashOnDeliveryProvider` (real), `MobileMoneyStubProvider`, `CardStubProvider` | MTN/Airtel Money SDK, a card processor |
| `SmsProvider` | `ConsoleSmsProvider` (logs + echoes code in dev) | Africa's Talking / Twilio |

## Frontend data layer (`packages/api-client`)

- `ApiClient` — typed fetch wrapper. Injects the bearer token (mobile) or
  relies on httpOnly cookies (web, once business/admin dashboards are
  built), retries once through `/auth/refresh` on a 401, normalizes every
  failure into `ApiError` (`status`, `code`, `message`) so screens branch on
  `error.code` / `error.isOutsideServiceArea` instead of parsing text.
- React Query hooks (`hooks/*.ts`) wrap every endpoint — `useLogin`,
  `useBusinesses`, `useCreateOrder`, `useOrder`, etc. — shared verbatim by
  all four frontends.
- `subscribeToOrderTracking` / `subscribeToNotifications` — Socket.io-client
  wrappers with reconnection built in (matters on the flaky mobile networks
  this app targets).
- `TokenStorage` is an interface; each app supplies its own (mobile:
  `expo-secure-store`; web dashboards: a cookie-backed no-op once built).

## Design system (`packages/design-tokens`)

- **Palette**: primary deep green (`#0E6E4E`), secondary warm orange
  (`#F4A425`), full 50–900 ramps for both, neutral/charcoal text scale,
  semantic success/warning/error/info.
- **Type**: Manrope (headings) / Inter (body) — chosen for a distinctive
  brand voice while staying legible at small sizes on low-end Android
  screens.
- **Spacing/radius/shadow scales** and an SVG brand mark (geometric
  chevron-in-circle) live here as plain TS objects — see `brand.ts`.
- **Styling reality check**: the original plan called for one Tailwind
  preset shared by web (Tailwind) and mobile (NativeWind) built from these
  tokens. In practice, NativeWind v4's typegen resolves `react-native`
  module augmentation against its *own* nested copy of `react-native` in
  this workspace layout, which breaks TypeScript's `className` prop
  augmentation. `customer-mobile` therefore uses plain `StyleSheet` +
  `@chirudeli/design-tokens` values directly instead of NativeWind; the
  *visual* palette is still identical, just not literally shared code with
  the web Tailwind config. Revisit NativeWind once its monorepo resolution
  story is more solid, or consider `react-native-unistyles` as an
  alternative.

## Navigation maps

### Customer (`apps/customer-mobile`) — fully implemented

```
AuthNavigator (signed out)
  Onboarding → Login | Register → OtpLogin
LocationPermissionScreen (signed in, once, before first Home load)
RootStackNavigator (signed in)
  Tabs: Home | Search | Orders | Favorites | Profile
  Categories, BusinessListing, BusinessDetails, ProductDetails (modal)
  Cart (modal) → Checkout → Payment (Mobile Money/Card only) → OrderConfirmation
  LiveTracking, OrderDetails, Notifications, Addresses, HelpSupport
```

### Rider (`apps/rider-mobile`) — nav shell only this session

```
AuthNavigator: Login → Registration → DocumentUpload → ApprovalPending
MainNavigator (once APPROVED):
  Tabs: Dashboard | Earnings | History | Profile
  DeliveryRequest (modal) → PickupNavigation → PickupConfirmation
    → DeliveryNavigation → DeliveryConfirmation (PIN entry)
```

### Business (`apps/business-web`) — fully wired

```
Auth: Login → Register (personal + store info + dynamic document upload) → ApprovalPending
Dashboard (sidebar layout):
  Dashboard (stats + onboarding checklist + Activate Store)
  Orders → OrderDetails (accept/prepare/ready/reject)
  Products → Add/Edit Product | Categories
  Store Profile (+ open/closed toggle) | Opening Hours
  Sales | Reviews | Notifications
```

### Admin (`apps/admin-web`) — core sections fully wired

```
Login
Dashboard (sidebar layout):
  Overview (platform stats)
  Store Approvals → StoreDetail (review, approve/reject/request changes,
    per-document approve/reject)
  Stores → StoreDetail (search/filter, suspend/reactivate/deactivate, edit)
  Store Classes (create/edit/delete, required-documents editor)
  Store Managers (suspend/reactivate/reset password)
  Riders → Approval | Customers
  Orders → OrderDetails (global master-order monitoring)
  Live Deliveries | Products | Delivery Zones | Delivery Fees
  Commissions | Promotions | Reports | Settings
```
Riders/Customers/Live Deliveries/Products(admin)/Delivery Zones & Fees/
Commissions/Promotions/Reports/Settings remain placeholder pages — see
`docs/roadmap.md`.

## Business rules enforced today

- A business cannot receive orders until `Business.status = APPROVED` AND
  `isActivated = true` (`computeOrder` in `orders.service.ts` checks both) —
  see "Store classes, approval workflow & RBAC" above.
- A business can pause its store (`storeState = PAUSED`) — `createOrder`
  rejects new orders while paused.
- Products can be marked `isAvailable = false` — checked at order creation,
  not just hidden client-side.
- Delivery fees are calculated automatically from zone + distance; the
  `Order.deliveryFeeOverridden` flag and `AuditLog` exist for the admin
  override path (Phase 3).
- Completed (`DELIVERED`) or `CANCELLED` store orders have no further status
  transitions available — the state machine has no outgoing edges from
  either.
- Payment status is tracked independently of delivery status.
- Duplicate order submissions are prevented by `MasterOrder.idempotencyKey`.
- Cancelling a master order requires every one of its store orders to still
  be in a cancellable state (`PENDING_CONFIRMATION`/`CONFIRMED`) — one
  business already preparing food blocks cancellation of the whole order.
- Every state-changing action that matters (order placed, order cancelled,
  customer registered) writes an `AuditLog` row via `recordAudit()`.
