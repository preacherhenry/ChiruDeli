import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './lib/env';
import { registerErrorHandler } from './plugins/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { businessesRoutes } from './modules/businesses/businesses.routes';
import { addressesRoutes } from './modules/addresses/addresses.routes';
import { ordersRoutes } from './modules/orders/orders.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { promotionsRoutes } from './modules/promotions/promotions.routes';
import { devRoutes } from './modules/dev/dev.routes';

export function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'development'
        ? { level: 'debug', transport: { target: 'pino-pretty' } }
        : { level: 'info' },
  });

  app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  registerErrorHandler(app);

  app.get('/health', async () => ({ status: 'ok', service: 'chirudeli-api', time: new Date().toISOString() }));

  app.register(authRoutes);
  app.register(businessesRoutes);
  app.register(addressesRoutes);
  app.register(ordersRoutes);
  app.register(notificationsRoutes);
  app.register(promotionsRoutes);
  app.register(devRoutes);

  return app;
}
