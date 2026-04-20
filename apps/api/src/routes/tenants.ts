import type { FastifyInstance } from 'fastify';

export async function tenantRoutes(app: FastifyInstance) {
  app.get('/:slug/health', async (req, reply) => {
    reply.code(501).send({ error: 'not_implemented' });
  });
}
