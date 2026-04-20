import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { resolveTenantDb } from '../tenant-resolver.js';
import { odooPost, odooGet } from '../odoo-client.js';

const createSchema = z.object({
  tenant_slug: z.string(),
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
    const db = await resolveTenantDb(body.tenant_slug);
    const data = await odooPost(db, '/hashtap/order', body);
    return reply.send(data);
  });

  app.get<{ Params: { tenantSlug: string; orderId: string } }>(
    '/:tenantSlug/:orderId',
    async (req, reply) => {
      const { tenantSlug, orderId } = req.params;
      const db = await resolveTenantDb(tenantSlug);
      const data = await odooGet(db, `/hashtap/order/${orderId}/status`);
      return reply.send(data);
    },
  );
}
