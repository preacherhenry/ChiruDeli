/**
 * Drives a real (possibly multi-store) order through the full ChiruDeli
 * workflow against a RUNNING API server (`npm run dev` in another
 * terminal), so the customer app's live tracking screen can be demoed
 * end-to-end before the rider and business apps exist. Talks to the
 * server's /dev/* harness (dev.routes.ts) so every Socket.io broadcast
 * comes from the same process the mobile app is connected to.
 *
 * Usage: npm run simulate [masterOrderId]
 *   With no id, simulates the demo customer's most recent order sitting in
 *   PENDING_CONFIRMATION (i.e. whatever you just checked out).
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const API_URL = process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
const DEMO_CUSTOMER_PHONE = '+260976543210';
const prisma = new PrismaClient();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function post(path: string, body?: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`${path} → ${res.status}: ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

async function main() {
  const masterOrderIdArg = process.argv[2];

  const masterOrder = masterOrderIdArg
    ? await prisma.masterOrder.findUniqueOrThrow({
        where: { id: masterOrderIdArg },
        include: { address: true, storeOrders: { include: { business: true }, orderBy: { sequence: 'asc' } } },
      })
    : await (async () => {
        const user = await prisma.user.findUniqueOrThrow({ where: { phone: DEMO_CUSTOMER_PHONE } });
        const customer = await prisma.customer.findUniqueOrThrow({ where: { userId: user.id } });
        const found = await prisma.masterOrder.findFirst({
          where: { customerId: customer.id, storeOrders: { some: { status: 'PENDING_CONFIRMATION' } } },
          orderBy: { placedAt: 'desc' },
          include: { address: true, storeOrders: { include: { business: true }, orderBy: { sequence: 'asc' } } },
        });
        if (!found) {
          throw new Error(
            `No pending order found for ${DEMO_CUSTOMER_PHONE}. Place an order in the customer app first, or pass a master order id: npm run simulate <masterOrderId>`,
          );
        }
        return found;
      })();

  const storeCount = masterOrder.storeOrders.length;
  console.log(
    `Simulating order ${masterOrder.orderNumber} (${masterOrder.id}) — ${storeCount} store${storeCount > 1 ? 's' : ''}\n`,
  );

  const step = async (label: string, fn: () => Promise<unknown>, delayMs = 2500) => {
    await fn();
    console.log(`  ✓ ${label}`);
    await sleep(delayMs);
  };

  for (const status of ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] as const) {
    for (const so of masterOrder.storeOrders) {
      await step(`${so.business.name}: ${status.replace(/_/g, ' ').toLowerCase()}`, () =>
        post(`/dev/store-orders/${so.id}/advance`, { toStatus: status }),
      );
    }
  }

  const riders = (await fetch(`${API_URL}/dev/riders/online`).then((r) => r.json())) as Array<{
    id: string;
    fullName: string;
  }>;
  if (riders.length === 0) throw new Error('No online riders — run `npm run prisma:seed` first.');
  const rider = riders[0]!;
  await step(`Rider ${rider.fullName} assigned`, () => post(`/dev/master-orders/${masterOrder.id}/assign-rider`, { riderId: rider.id }));

  const delivery = await prisma.masterDelivery.findUniqueOrThrow({
    where: { masterOrderId: masterOrder.id },
    include: { stops: { orderBy: { sequence: 'asc' } } },
  });

  let riderLat = masterOrder.storeOrders[0]!.business.latitude - 0.01;
  let riderLng = masterOrder.storeOrders[0]!.business.longitude - 0.01;

  for (const stop of delivery.stops) {
    console.log(`  → Rider en route to ${stop.label}...`);
    for (let i = 1; i <= 3; i++) {
      const t = i / 3;
      await post(`/dev/master-deliveries/${delivery.id}/ping`, {
        riderId: rider.id,
        latitude: lerp(riderLat, stop.latitude, t),
        longitude: lerp(riderLng, stop.longitude, t),
      });
      await sleep(1200);
    }
    riderLat = stop.latitude;
    riderLng = stop.longitude;

    await step(
      stop.type === 'PICKUP' ? `Picked up from ${stop.label}` : 'Delivered to customer',
      () => post(`/dev/master-orders/${masterOrder.id}/complete-stop/${stop.id}`),
      stop.type === 'DROPOFF' ? 0 : 1500,
    );
  }

  console.log('\nDone — order fully delivered. Check the customer app tracking screen for live updates.');
}

main()
  .catch((err) => {
    console.error('\nSimulation failed:', err.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
