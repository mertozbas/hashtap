import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../config/env.js';
import { odooPost, odooGet } from '../odoo-client.js';

const createSchema = z.object({
  table_slug: z.string(),
  items: z.array(z.object({
    item_id: z.number(),
    qty: z.number().int().positive(),
    modifiers: z.array(z.number()).optional(),
    note: z.string().optional(),
  })),
  correlation_id: z.string().uuid(),
});

export async function orderRoutes(app: FastifyInstance) {
  app.post('/', async (req, reply) => {
    const body = createSchema.parse(req.body);
    const data = await odooPost(env.ODOO_DB, '/hashtap/order', body);
    return reply.send(data);
  });

  app.get<{ Params: { orderId: string } }>(
    '/:orderId',
    async (req, reply) => {
      const { orderId } = req.params;
      const data = await odooGet(env.ODOO_DB, `/hashtap/order/${orderId}/status`);
      return reply.send(data);
    },
  );
}
