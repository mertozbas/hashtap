import type { FastifyInstance } from 'fastify';
import { menuRoutes } from './menu.js';
import { orderRoutes } from './orders.js';
import { paymentRoutes } from './payments.js';
import { tenantRoutes } from './tenants.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(tenantRoutes, { prefix: '/v1/tenants' });
  await app.register(menuRoutes, { prefix: '/v1/menu' });
  await app.register(orderRoutes, { prefix: '/v1/orders' });
  await app.register(paymentRoutes, { prefix: '/v1/payments' });
}
