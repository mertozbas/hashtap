import type { FastifyInstance } from 'fastify';

/**
 * Ödeme modeli: iyzico subMerchant — para doğrudan restoranın alt hesabına.
 * HashTap paraya dokunmaz, sadece ödemeyi tetikler.
 *
 * POST /v1/payments/intent              — ödeme oluştur (3DS redirect döner)
 * POST /v1/payments/webhook/iyzico      — iyzico webhook imza doğrulama
 * POST /v1/payments/webhook/paytr       — paytr webhook
 */
export async function paymentRoutes(app: FastifyInstance) {
  app.post('/webhook/iyzico', async (req, reply) => {
    reply.code(501).send({ error: 'not_implemented' });
  });
}
