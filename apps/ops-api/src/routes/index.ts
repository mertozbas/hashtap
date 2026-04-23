import type { FastifyInstance } from 'fastify';
import { heartbeatRoutes } from './heartbeat.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(heartbeatRoutes, { prefix: '/v1/ops' });
}
