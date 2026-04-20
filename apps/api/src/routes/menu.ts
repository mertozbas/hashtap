import type { FastifyInstance } from 'fastify';

/**
 * GET  /v1/menu/:tenantSlug          — müşteri PWA'sına menü
 * POST /v1/menu/:tenantId/items      — restoran panelinden ürün düzenleme
 * POST /v1/menu/:tenantId/sync       — POS'tan menü senkronizasyonu tetikleme
 *
 * Menü senkronizasyonu için katmanlı sahiplik modeli bkz. docs/hashcash.md §7.
 */
export async function menuRoutes(app: FastifyInstance) {
  app.get('/:tenantSlug', async (req, reply) => {
    reply.code(501).send({ error: 'not_implemented' });
  });
}
