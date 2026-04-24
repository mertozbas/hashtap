import type { FastifyInstance } from 'fastify';
import { menuRoutes, posMenuRoutes } from './menu.js';
import { orderRoutes } from './orders.js';
import { paymentRoutes } from './payments.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(menuRoutes, { prefix: '/v1/menu' });
  await app.register(posMenuRoutes, { prefix: '/v1/pos/menu' });
  await app.register(orderRoutes, { prefix: '/v1/orders' });
  await app.register(paymentRoutes, { prefix: '/v1/payments' });
}
