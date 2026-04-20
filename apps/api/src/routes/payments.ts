import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { resolveTenantDb } from '../tenant-resolver.js';
import { odooPost } from '../odoo-client.js';

const startSchema = z.object({
  tenant_slug: z.string(),
  order_id: z.number(),
  return_url: z.string().url(),
});

export async function paymentRoutes(app: FastifyInstance) {
  app.post('/3ds/start', async (req, reply) => {
    const body = startSchema.parse(req.body);
    const db = await resolveTenantDb(body.tenant_slug);
    const data = await odooPost(db, '/hashtap/payment/3ds/start', body);
    return reply.send(data);
  });
}
