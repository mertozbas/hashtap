import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';
import { odooGet, odooPost } from '../odoo-client.js';

/**
 * Cashier + Waiter için POS endpoint'leri — Odoo /hashtap/pos/* proxy'si.
 * JSON-RPC çağrıları (Odoo `type="json"` controller'ları) `params` içinde
 * argümanları bekler; buradaki POST'lar bunu sarmalar.
 */

function odooJsonRpc(db: string, path: string, params: unknown) {
  return odooPost(db, path, { jsonrpc: '2.0', params });
}

function unwrap(body: unknown): unknown {
  if (body && typeof body === 'object' && 'result' in (body as Record<string, unknown>)) {
    return (body as { result: unknown }).result;
  }
  return body;
}

export async function posRoutes(app: FastifyInstance) {
  // GET'ler http type — Odoo make_json_response doğrudan döner
  app.get('/tables', async (_req, reply) => {
    const data = await odooGet(env.ODOO_DB, '/hashtap/pos/tables');
    return reply.send(data);
  });

  app.get('/tables/:tableId', async (req, reply) => {
    const { tableId } = req.params as { tableId: string };
    const data = await odooGet(env.ODOO_DB, `/hashtap/pos/tables/${tableId}`);
    return reply.send(data);
  });

  app.get('/orders', async (req, reply) => {
    const { state } = req.query as { state?: string };
    const q = state ? `?state=${encodeURIComponent(state)}` : '';
    const data = await odooGet(env.ODOO_DB, `/hashtap/pos/orders${q}`);
    return reply.send(data);
  });

  app.get('/orders/:orderId', async (req, reply) => {
    const { orderId } = req.params as { orderId: string };
    const data = await odooGet(env.ODOO_DB, `/hashtap/pos/orders/${orderId}`);
    return reply.send(data);
  });

  // JSON-RPC gönderimleri
  app.post('/orders', async (req, reply) => {
    const body = await odooJsonRpc(env.ODOO_DB, '/hashtap/pos/orders', req.body ?? {});
    return reply.send(unwrap(body));
  });

  app.post('/orders/:orderId/fire', async (req, reply) => {
    const { orderId } = req.params as { orderId: string };
    const body = await odooJsonRpc(env.ODOO_DB, `/hashtap/pos/orders/${orderId}/fire`, {});
    return reply.send(unwrap(body));
  });

  app.post('/orders/:orderId/advance', async (req, reply) => {
    const { orderId } = req.params as { orderId: string };
    const body = await odooJsonRpc(env.ODOO_DB, `/hashtap/pos/orders/${orderId}/advance`, {});
    return reply.send(unwrap(body));
  });

  app.post('/orders/:orderId/cancel', async (req, reply) => {
    const { orderId } = req.params as { orderId: string };
    const body = await odooJsonRpc(env.ODOO_DB, `/hashtap/pos/orders/${orderId}/cancel`, {});
    return reply.send(unwrap(body));
  });

  app.post('/orders/:orderId/pay', async (req, reply) => {
    const { orderId } = req.params as { orderId: string };
    const body = await odooJsonRpc(
      env.ODOO_DB,
      `/hashtap/pos/orders/${orderId}/pay`,
      req.body ?? {},
    );
    return reply.send(unwrap(body));
  });
}
