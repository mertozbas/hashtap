import { createHash } from 'node:crypto';
import type { MenuSnapshot, Order } from '@hashtap/shared';
import type {
  AdapterHealth,
  PaymentMeta,
  PosAdapter,
  PosOrderId,
} from '../adapter.js';
import { PosAdapterError } from '../adapter.js';
import type { PosConfig } from '../registry.js';

/**
 * SambaPOS v5 Messaging API (GraphQL).
 * Dokümantasyon: https://doc.sambapos.com/
 *
 * Kurulum: restoranın SambaPOS sunucusunda messaging endpoint açık olmalı,
 * static terminal token bizde. Tenant başına config:
 *   { endpoint, token, terminalId, mode? }
 *
 * mode: 'live' (default) | 'mock'. 'mock' mod HashTap test/dev ortamında
 * çağrıları simüle eder (ağa çıkmaz), pilot öncesi QA için.
 */

interface SambaConfig {
  endpoint: string;
  token: string;
  terminalId: string;
  tenantId: string;
  mode?: 'live' | 'mock';
  timeoutMs?: number;
}

function ensure<T>(value: T | undefined, field: string): T {
  if (value === undefined || value === null || value === '') {
    throw new PosAdapterError(`SambaPOS config eksik: ${field}`, false);
  }
  return value;
}

function parseConfig(raw: PosConfig): SambaConfig {
  return {
    endpoint: ensure(raw.endpoint as string, 'endpoint'),
    token: ensure(raw.token as string, 'token'),
    terminalId: ensure(raw.terminalId as string, 'terminalId'),
    tenantId: ensure(raw.tenantId as string, 'tenantId'),
    mode: (raw.mode as 'live' | 'mock' | undefined) ?? 'live',
    timeoutMs: (raw.timeoutMs as number | undefined) ?? 8000,
  };
}

/**
 * POS'un string ID'sini deterministik UUID v5-benzeri bir UUID'ye çevirir.
 * Aynı tenantId + posId eşleşmesi her zaman aynı UUID'yi üretir.
 */
function stableUuid(tenantId: string, posId: string): string {
  const h = createHash('sha1').update(`${tenantId}:${posId}`).digest('hex');
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    `5${h.slice(13, 16)}`, // v5 marker
    `8${h.slice(17, 20)}`, // RFC 4122 variant
    h.slice(20, 32),
  ].join('-');
}

async function gql<T>(
  cfg: SambaConfig,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  if (cfg.mode === 'mock') {
    return mockResponse<T>(query);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
  try {
    const res = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${cfg.token}`,
        'x-terminal-id': cfg.terminalId,
      },
      body: JSON.stringify({ query, variables }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const retryable = res.status >= 500 || res.status === 429;
      throw new PosAdapterError(
        `SambaPOS HTTP ${res.status}`,
        retryable,
      );
    }
    const body = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
    if (body.errors?.length) {
      throw new PosAdapterError(
        `SambaPOS GraphQL error: ${body.errors.map((e) => e.message).join(', ')}`,
        false,
      );
    }
    if (!body.data) {
      throw new PosAdapterError('SambaPOS empty response', true);
    }
    return body.data;
  } catch (err) {
    if (err instanceof PosAdapterError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new PosAdapterError('SambaPOS timeout', true, err);
    }
    throw new PosAdapterError(
      err instanceof Error ? err.message : 'SambaPOS unknown error',
      true,
      err,
    );
  } finally {
    clearTimeout(timer);
  }
}

function mockResponse<T>(query: string): T {
  if (query.includes('addTicket')) {
    return { addTicket: { id: `mock-samba-${Date.now()}` } } as T;
  }
  if (query.includes('paymentProcess')) {
    return { paymentProcess: { ok: true } } as T;
  }
  if (query.includes('products')) {
    return {
      products: [
        {
          id: 'mock-1',
          name: 'Mock Ürün',
          price: 10000,
          categoryName: 'Mock',
        },
      ],
    } as T;
  }
  return {} as T;
}

function linesToPayload(order: Order) {
  return order.lines.map((l) => ({
    menuItemName: l.menuItemId,
    quantity: l.qty,
    price: l.unitPriceKurus / 100,
    note: l.note ?? '',
    modifiers: l.modifiers ?? [],
  }));
}

export class SambaPosAdapter implements PosAdapter {
  readonly type = 'sambapos_api' as const;
  private readonly cfg: SambaConfig;

  constructor(config: PosConfig) {
    this.cfg = parseConfig(config);
  }

  async pushOrder(order: Order, tableLabel: string): Promise<PosOrderId> {
    const data = await gql<{ addTicket: { id: string } }>(
      this.cfg,
      `mutation AddTicket($input: TicketInput!) { addTicket(input: $input) { id } }`,
      {
        input: {
          externalId: order.id,
          terminalId: this.cfg.terminalId,
          tableName: tableLabel,
          orderLines: linesToPayload(order),
        },
      },
    );
    return data.addTicket.id;
  }

  async markPaid(posOrderId: PosOrderId, payment: PaymentMeta): Promise<void> {
    await gql<{ paymentProcess: { ok: boolean } }>(
      this.cfg,
      `mutation Pay($ticketId: ID!, $input: PaymentInput!) {
         paymentProcess(ticketId: $ticketId, input: $input) { ok }
       }`,
      {
        ticketId: posOrderId,
        input: {
          method: payment.method,
          amount: payment.amountKurus / 100,
          tip: payment.tipKurus / 100,
          externalRef: payment.gatewayTxId,
        },
      },
    );
  }

  async syncMenu(): Promise<MenuSnapshot> {
    const data = await gql<{
      products: Array<{ id: string; name: string; price: number; categoryName: string }>;
    }>(
      this.cfg,
      `query { products { id name price categoryName } }`,
      {},
    );
    const capturedAt = new Date().toISOString();
    return {
      tenantId: this.cfg.tenantId,
      capturedAt,
      items: data.products.map((p) => ({
        id: stableUuid(this.cfg.tenantId, p.id),
        tenantId: this.cfg.tenantId,
        conceptId: null,
        nameTr: p.name,
        hidden: false,
        cachedPriceKurus: Math.round(p.price * 100),
        posLink: {
          posProductId: p.id,
          posName: p.name,
          posPriceKurus: Math.round(p.price * 100),
          lastSyncedAt: capturedAt,
        },
      })),
    };
  }

  async healthCheck(): Promise<AdapterHealth> {
    const started = Date.now();
    try {
      await gql<{ products: unknown[] }>(
        this.cfg,
        `query { products { id } }`,
        {},
      );
      return { ok: true, latencyMs: Date.now() - started, lastSuccessAt: new Date().toISOString() };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - started,
        lastError: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
