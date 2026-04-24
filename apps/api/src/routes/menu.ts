import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../config/env.js';
import { odooGet } from '../odoo-client.js';

const paramsSchema = z.object({
  tableSlug: z.string().min(1),
});

export async function menuRoutes(app: FastifyInstance) {
  app.get('/:tableSlug', async (req, reply) => {
    const { tableSlug } = paramsSchema.parse(req.params);
    const data = await odooGet(env.ODOO_DB, `/hashtap/menu/${tableSlug}`);
    return reply.send(data);
  });
}

export async function posMenuRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    const data = await odooGet(env.ODOO_DB, '/hashtap/pos/menu');
    return reply.send(data);
  });
}
