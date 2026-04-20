import type { FastifyInstance } from 'fastify';

/**
 * Tenant (restoran) yönetimi. Multi-tenant model: her restoran bir tenant_id,
 * tenant altında bir veya daha fazla concept (restoran/bar/nargile).
 *
 * POST /v1/tenants                       — yeni restoran onboard (sihirbaz başlangıcı)
 * GET  /v1/tenants/:id                   — tenant bilgileri
 * POST /v1/tenants/:id/pos               — POS bağlantısı kurma
 * POST /v1/tenants/:id/concepts          — konsept ekle/düzenle
 * POST /v1/tenants/:id/tables            — masa tanımla, QR üret
 */
export async function tenantRoutes(app: FastifyInstance) {
  app.get('/:id', async (req, reply) => {
    reply.code(501).send({ error: 'not_implemented' });
  });
}
