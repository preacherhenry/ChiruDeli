import { buildApp } from './app';
import { env } from './lib/env';
import { createSocketGateway } from './realtime/socket';

async function main() {
  const app = buildApp();
  await app.ready();

  createSocketGateway(app.server);

  await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info(`ChiruDeli API listening on http://${env.HOST}:${env.PORT}`);
}

main().catch((err) => {
  console.error('Failed to start ChiruDeli API:', err);
  process.exit(1);
});
