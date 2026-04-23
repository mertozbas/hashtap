import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../config/env.js';
import { odooPost } from '../odoo-client.js';

const startSchema = z.object({
  order_id: z.number(),
  return_url: z.string().url(),
});

export async function paymentRoutes(app: FastifyInstance) {
  app.post('/3ds/start', async (req, reply) => {
    const body = startSchema.parse(req.body);
    const data = await odooPost(env.ODOO_DB, '/hashtap/payment/3ds/start', body);
    return reply.send(data);
  });
}
