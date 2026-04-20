import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { resolveTenantDb } from '../tenant-resolver.js';
import { odooGet } from '../odoo-client.js';

const paramsSchema = z.object({
  tenantSlug: z.string().min(1),
  tableSlug: z.string().min(1),
});

export async function menuRoutes(app: FastifyInstance) {
  app.get('/:tenantSlug/:tableSlug', async (req, reply) => {
    const { tenantSlug, tableSlug } = paramsSchema.parse(req.params);
    const db = await resolveTenantDb(tenantSlug);
    const data = await odooGet(db, `/hashtap/menu/${tenantSlug}/${tableSlug}`);
    return reply.send(data);
  });
}
