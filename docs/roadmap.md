# ChiruDeli — Roadmap

This tracks what's real today vs. what's next, mapped to the original
34-phase / 4-interface spec. See `docs/architecture.md` for how the pieces
fit together.

## Done this session

- Monorepo scaffold (`npm` workspaces), shared design tokens, shared Zod
  types/enums, shared typed API client + React Query hooks.
- Full Prisma schema (Postgres) covering every entity in the spec: identity,
  businesses/catalog, orders/delivery, payments/money, promotions/reviews,
  zones/fees, notifications, audit log.
- Fastify API: auth (phone+password for all 4 roles, OTP for customers,
  refresh/logout), business & product browsing, order creation (idempotent,
  fee + commission calculated automatically, service-area gated), order
  cancellation with a configurable window, post-delivery reviews,
  notifications, promo code validation, Socket.io real-time gateway.
- Delivery fee engine (base+distance formula *and* fixed-fee zones),
  commission engine (percent snapshotted per order), Haversine distance
  provider — all behind swappable interfaces.
- Seed script with realistic Chirundu businesses/products/zones/accounts,
  plus `scripts/simulate-order-progress.ts` to drive a real order through
  the full status workflow over real Socket.io events.
- **Customer app** (Expo/React Native): every screen from spec §32, fully
  wired to the live API — auth, browse, cart, checkout (address, promo code,
  Cash on Delivery/Mobile Money/Card), live order tracking with real-time
  status + map, order history, reorder, reviews, favorites (client-local for
  now), notifications, profile, addresses, help.
- Rider, business and admin apps scaffolded with their full navigation maps
  and design system wired in, screens present and routable with placeholder
  content — see "Next up" below for making them real.

## Known limitations to fix before this is production-real

- **Payments**: Cash on Delivery is fully functional. Mobile Money and Card
  are wired end-to-end through the app but the server-side
  `MobileMoneyStubProvider`/`CardStubProvider` don't call a real gateway —
  swap in MTN/Airtel Money and a card processor's SDK behind the existing
  `PaymentProvider` interface (`apps/api/src/lib/payments.ts`).
- **SMS/OTP**: `ConsoleSmsProvider` logs the code instead of sending a real
  SMS. Swap in Africa's Talking or Twilio behind the `SmsProvider` interface
  (`apps/api/src/lib/sms.ts`). Currently dev-only: the OTP endpoint echoes
  the code back in non-production responses.
- **Maps**: `TrackingMap` only mounts when
  `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is set. Get a key from Google Cloud
  Console, add it to `apps/customer-mobile/.env`, and wire the equivalent
  native config (`app.json` → `ios.config.googleMapsApiKey` /
  `android.config.googleMaps.apiKey`) for a production build.
- **Rider location**: real GPS pings only exist via the dev simulation
  script today — the real rider app needs to call
  `POST /dev/deliveries/:id/ping`'s *production* equivalent (a role-gated
  `POST /riders/me/location`) on an interval while online.
- **Favorites**: client-only (AsyncStorage), not synced to the
  `FavoriteBusiness`/`FavoriteProduct` tables yet.
- **2FA**: `AdminUser.twoFactorSecret`/`twoFactorEnabled` exist in the
  schema but aren't enforced yet — architecture-ready, not wired up.

## Next up, in spec order

1. **Rider app backend** — approval workflow (`RiderDocument` upload +
   admin review), `GET /deliveries/available`, accept/decline, the
   pickup→dropoff status endpoints `advanceOrderStatus`/`assignRider`
   already support server-side (just need role-gated routes), earnings
   aggregation, delivery-PIN confirmation at handoff.
2. **Business dashboard backend** — registration + approval workflow,
   product CRUD (`upsertProductSchema` already defined), order
   accept/reject and status updates, sales reporting, store pause/unpause.
3. **Admin dashboard backend** — business/rider approval queues, customer
   management (suspend), delivery zone & fee CRUD, commission overrides,
   promotion CRUD, live-deliveries feed (`admin:live` socket room is
   reserved for this), reports/analytics aggregation endpoints.
4. **Real payment/SMS/maps providers** (see above).
5. **Testing, security, performance pass** — broaden the Vitest suite past
   fee/commission/state-machine coverage, add integration tests against a
   real Postgres, load-test the order-creation path, and run
   `/security-review` before any production deployment.

## Explicitly out of scope for a first production deploy

- Multi-town expansion — the `DeliveryZone` model already supports it
  (nothing hardcodes "Chirundu"), but only Chirundu zones are seeded.
- Push notifications (APNs/FCM) — today notifications are in-app + Socket.io
  only; `Notification.channel` in the schema anticipates this.
