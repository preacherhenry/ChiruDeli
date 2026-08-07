# ChiruDeli

**Anything You Need. Delivered.** — a delivery platform for Chirundu, Zambia.

Four apps in one monorepo: **customer** (Expo/React Native, fully working),
**rider** (Expo/React Native, navigation shell), **business** and **admin**
(Next.js, navigation shells), all backed by one Fastify + PostgreSQL API.
See [`docs/architecture.md`](docs/architecture.md) for how it's built and
[`docs/roadmap.md`](docs/roadmap.md) for what's next.

## Prerequisites

- Node.js 20+
- A free [Neon](https://neon.tech) Postgres project (or any Postgres 14+ connection string)

## 1. Install

```bash
npm install
```

## 2. Configure the database

Create `apps/api/.env` (copy from `.env.example` at the repo root) and set
`DATABASE_URL` to your Neon **pooled connection** string:

```
DATABASE_URL="postgresql://user:password@ep-xxxx.neon.tech/chirudeli?sslmode=require"
```

Then run migrations and seed realistic Chirundu data (businesses, products,
delivery zones, a demo customer/rider/business/admin login):

```bash
npm run prisma:migrate --workspace=apps/api
npm run prisma:seed --workspace=apps/api
```

Demo logins (printed again at the end of the seed script):

| Role | Phone | Password |
|---|---|---|
| Admin | +260970000001 | Admin123! |
| Business (Chirundu Grill House) | +260971000001 | Business123! |
| Rider (Kunda Banda) | +260975000001 | Rider123! |
| Customer (Mwansa Phiri) | +260976543210 | Customer123! |

## 3. Run the API

```bash
npm run dev:api
```

Starts Fastify + Socket.io on `http://localhost:4000`. Check `curl
http://localhost:4000/health`.

## 4. Run an app

```bash
npm run dev:customer   # Expo — scan the QR code with Expo Go, or press `w` for web
npm run dev:rider      # Expo — nav shell, real login only
npm run dev:business   # Next.js on http://localhost:3000
npm run dev:admin      # Next.js on http://localhost:3001
```

The mobile apps' `.env` defaults to `http://localhost:4000`, which works for
the Expo web target and simulators. **On a physical phone via Expo Go**,
`localhost` means the phone itself — replace it with your computer's LAN IP
(e.g. `EXPO_PUBLIC_API_URL=http://192.168.1.20:4000`) in
`apps/customer-mobile/.env` / `apps/rider-mobile/.env`.

## 5. See a live order end-to-end

1. In the customer app: register or log in as the demo customer, browse
   Chirundu Grill House, add items, check out with Cash on Delivery.
2. With the API still running, in another terminal:
   ```bash
   npm run simulate --workspace=apps/api
   ```
   This drives the order you just placed through the full status workflow
   (confirmed → preparing → rider assigned → picked up → on the way →
   delivered) over real Socket.io events — watch the customer app's Live
   Order Tracking screen update in real time.

## Deploying the API (Render)

Running the API and Expo dev server on your own machine means your phone has
to reach that machine's LAN IP — which breaks the moment either device
changes network (mobile data, a different WiFi, a hotspot, restrictive
firewalls). Deploying the API gives it a stable public URL so this stops
being a factor.

1. Push this repo to GitHub (already done if you're reading this from there).
2. On [render.com](https://render.com), click **New** → **Blueprint**, connect
   this repo. Render reads [`render.yaml`](render.yaml) automatically and
   provisions a free web service (`chirudeli-api`), generating secure random
   values for the JWT secrets on its own.
3. Render will ask for one value it can't generate: **`DATABASE_URL`** — paste
   your Neon pooled connection string (same one from `apps/api/.env`).
4. Deploy. Render runs `prisma migrate deploy` automatically as part of the
   build, so your existing Neon database (schema + seeded data) is reused
   as-is — no separate production database needed for testing.
5. Once live, your API is at `https://chirudeli-api.onrender.com` (or
   whatever URL Render assigns — check the dashboard). Point the mobile apps
   at it by editing `apps/customer-mobile/.env` /
   `apps/rider-mobile/.env`:
   ```
   EXPO_PUBLIC_API_URL=https://chirudeli-api.onrender.com
   EXPO_PUBLIC_WS_URL=https://chirudeli-api.onrender.com
   ```
   Socket.io works transparently over HTTPS, no separate config needed.

Note: Render's free plan spins the service down after 15 minutes of
inactivity — the first request after a while will take a few extra seconds
to wake it back up.

## Project structure

```
apps/api               Fastify + TypeScript backend, PostgreSQL/Prisma
apps/customer-mobile    Expo/React Native — full customer app
apps/rider-mobile       Expo/React Native — rider nav shell
apps/business-web       Next.js — business dashboard nav shell
apps/admin-web          Next.js — admin dashboard nav shell
packages/design-tokens  Brand palette, type scale, spacing, SVG mark
packages/shared-types   Zod schemas + enums shared by API and every app
packages/api-client     Typed API client + React Query hooks + socket helpers
docs/                   Architecture and roadmap
```

## Testing

```bash
npm run test --workspace=apps/api   # fee/commission calculators + order state machine
```

## Tech stack

Fastify · Prisma · PostgreSQL · Socket.io · Zod · Expo/React Native ·
NativeWind · Next.js (App Router) · Tailwind CSS · React Query · Zustand
