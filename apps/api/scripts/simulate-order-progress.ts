/**
 * Drives a real order through the full ChiruDeli status workflow against a
 * RUNNING API server (`npm run dev` in another terminal), so the customer
 * app's live tracking screen can be demoed end-to-end before the rider and
 * business apps exist. Talks to the server's /dev/* harness (dev.routes.ts)
 * so every Socket.io broadcast comes from the same process the mobile app
 * is connected to.
 *
 * Usage: npm run simulate [orderId]
 *   With no orderId, simulates the demo customer's most recent order
 *   sitting in PENDING_CONFIRMATION (i.e. whatever you just checked out).
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
    headers: { 'Content-Type': 'application/json' },
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
  const orderIdArg = process.argv[2];

  const order = orderIdArg
    ? await prisma.order.findUniqueOrThrow({ where: { id: orderIdArg }, include: { business: true, address: true } })
    : await (async () => {
        const user = await prisma.user.findUniqueOrThrow({ where: { phone: DEMO_CUSTOMER_PHONE } });
        const customer = await prisma.customer.findUniqueOrThrow({ where: { userId: user.id } });
        const found = await prisma.order.findFirst({
          where: { customerId: customer.id, status: 'PENDING_CONFIRMATION' },
          orderBy: { placedAt: 'desc' },
          include: { business: true, address: true },
        });
        if (!found) {
          throw new Error(
            `No PENDING_CONFIRMATION order found for ${DEMO_CUSTOMER_PHONE}. Place an order in the customer app first, or pass an order id: npm run simulate <orderId>`,
          );
        }
        return found;
      })();

  console.log(`Simulating order ${order.orderNumber} (${order.id})\n`);

  const step = async (label: string, fn: () => Promise<unknown>, delayMs = 3500) => {
    await fn();
    console.log(`  ✓ ${label}`);
    await sleep(delayMs);
  };

  await step('Business confirmed the order', () => post(`/dev/orders/${order.id}/advance`, { toStatus: 'CONFIRMED' }));
  await step('Business is preparing the order', () => post(`/dev/orders/${order.id}/advance`, { toStatus: 'PREPARING' }));
  await step('Order ready for pickup', () => post(`/dev/orders/${order.id}/advance`, { toStatus: 'READY_FOR_PICKUP' }));

  const ridersRes = await fetch(`${API_URL}/dev/riders/online`);
  const riders = (await ridersRes.json()) as Array<{ id: string; fullName: string }>;
  if (riders.length === 0) throw new Error('No online riders — run `npm run prisma:seed` first.');
  const rider = riders[0]!;
  await step(`Rider ${rider.fullName} assigned`, () => post(`/dev/orders/${order.id}/assign-rider`, { riderId: rider.id }));

  const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { delivery: true } });
  const delivery = updatedOrder.delivery!;

  console.log('  → Rider en route to pickup...');
  for (let i = 1; i <= 3; i++) {
    const t = i / 3;
    await post(`/dev/deliveries/${delivery.id}/ping`, {
      riderId: rider.id,
      latitude: lerp(order.business.latitude - 0.01, order.business.latitude, t),
      longitude: lerp(order.business.longitude - 0.01, order.business.longitude, t),
    });
    await sleep(1500);
  }

  await step('Rider picked up the order', () => post(`/dev/orders/${order.id}/advance`, { toStatus: 'PICKED_UP' }));
  await step('Rider is on the way', () => post(`/dev/orders/${order.id}/advance`, { toStatus: 'ON_THE_WAY' }));

  console.log('  → Rider en route to customer...');
  for (let i = 1; i <= 4; i++) {
    const t = i / 4;
    await post(`/dev/deliveries/${delivery.id}/ping`, {
      riderId: rider.id,
      latitude: lerp(order.business.latitude, order.address.latitude, t),
      longitude: lerp(order.business.longitude, order.address.longitude, t),
    });
    await sleep(1500);
  }

  await step('Order delivered', () => post(`/dev/orders/${order.id}/advance`, { toStatus: 'DELIVERED' }), 0);

  console.log('\nDone — order fully delivered. Check the customer app tracking screen for live updates.');
}

main()
  .catch((err) => {
    console.error('\nSimulation failed:', err.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
