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
    business-web/         Next.js — nav shell + placeholder screens
    admin-web/             Next.js — nav shell + placeholder screens
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
  phone+OTP; business/rider/admin use phone+password. `AdminUser` has
  `twoFactorSecret`/`twoFactorEnabled` columns reserved for TOTP 2FA.
- **Real-time**: Socket.io, attached to the same HTTP server Fastify uses.
  Rooms: `order:{orderId}` (status + rider location, joined by customer,
  business, assigned rider), `user:{userId}` (personal notifications),
  `rider:{riderId}` and `business:{businessId}` reserved for the rider/
  business apps' live request feeds (Phase 2), `admin:live` reserved for the
  admin live-ops view (Phase 3).
- **Idempotency**: `Order.idempotencyKey` is a unique column. The client
  generates a UUID once per checkout attempt and resends it on retry;
  `POST /orders` looks the key up first and returns the existing order
  instead of creating a duplicate — this is what makes double-tapping
  "Place Order" or retrying after a dropped connection safe.

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

`Delivery.status` (rider-side, finer-grained, matches spec §13):
`ASSIGNED → EN_ROUTE_TO_PICKUP → ARRIVED_AT_PICKUP → PICKED_UP →
EN_ROUTE_TO_DROPOFF → ARRIVED_AT_DROPOFF → COMPLETED`, with a `deliveryPin`
required at handoff.

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

### Business (`apps/business-web`) — nav shell only this session

```
Auth: Login → Registration → ApprovalPending
Dashboard (sidebar layout):
  Overview | Orders → OrderDetails | Products → Add/Edit Product
  Business Profile | Sales | Notifications
```

### Admin (`apps/admin-web`) — nav shell only this session

```
Login
Dashboard (sidebar layout):
  Overview | Businesses → Approval | Riders → Approval | Customers
  Orders | Live Deliveries | Products | Delivery Zones | Delivery Fees
  Commissions | Promotions | Reports | Settings
```

## Business rules enforced today

- A business cannot receive orders until `Business.status = APPROVED`
  (`createOrder` checks this).
- A business can pause its store (`storeState = PAUSED`) — `createOrder`
  rejects new orders while paused.
- Products can be marked `isAvailable = false` — checked at order creation,
  not just hidden client-side.
- Delivery fees are calculated automatically from zone + distance; the
  `Order.deliveryFeeOverridden` flag and `AuditLog` exist for the admin
  override path (Phase 3).
- Completed (`DELIVERED`) or `CANCELLED` orders have no further status
  transitions available — the state machine has no outgoing edges from
  either.
- Payment status is tracked independently of delivery status.
- Duplicate order submissions are prevented by `idempotencyKey`.
- Every state-changing action that matters (order placed, order cancelled,
  customer registered) writes an `AuditLog` row via `recordAudit()`.
