import type { FastifyInstance } from 'fastify';

/**
 * Sipariş yaşam döngüsü (event-driven):
 *   created → paid → sent_to_pos → in_kitchen → ready → served
 *
 * POST /v1/orders                          — müşteri sipariş oluşturur (paid öncesi)
 * POST /v1/orders/:id/confirm-payment      — ödeme webhook'u tetikler
 * GET  /v1/orders/:id                      — durum sorgulama (müşteri PWA + panel)
 * PATCH /v1/orders/:id/status              — restoran panel: hazır / teslim edildi
 */
export async function orderRoutes(app: FastifyInstance) {
  app.post('/', async (req, reply) => {
    reply.code(501).send({ error: 'not_implemented' });
  });
}
