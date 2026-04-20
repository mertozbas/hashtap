import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import websocket from '@fastify/websocket';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { registerRoutes } from './routes/index.js';

async function main() {
  const app = Fastify({ loggerInstance: logger });

  await app.register(helmet);
  await app.register(cors, { origin: true, credentials: true });
  await app.register(websocket);

  await registerRoutes(app);

  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  try {
    await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
    logger.info({ port: env.API_PORT }, 'HashTap API ready');
  } catch (err) {
    logger.error(err, 'failed to start');
    process.exit(1);
  }
}

main();
