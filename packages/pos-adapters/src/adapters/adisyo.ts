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
 * Adisyo REST API (https://adisyo.com/api). Tenant başına API anahtarı,
 * çoklu şube desteği için branchId. Tenant başına config:
 *   { baseUrl, apiKey, branchId, tenantId, mode? }
 *
 * mode: 'live' (default) | 'mock'. Mock HashTap dev/QA için ağ çağrısı
 * yapmaz, stable cevaplar döner.
 */

interface AdisyoConfig {
  baseUrl: string;
  apiKey: string;
  branchId: string;
  tenantId: string;
  mode: 'live' | 'mock';
  timeoutMs: number;
}

function ensure<T>(v: T | undefined | null, field: string): T {
  if (v === undefined || v === null || v === '') {
    throw new PosAdapterError(`Adisyo config eksik: ${field}`, false);
  }
  return v;
}

function parseConfig(raw: PosConfig): AdisyoConfig {
  return {
    baseUrl: ensure(raw.baseUrl as string, 'baseUrl').replace(/\/$/, ''),
    apiKey: ensure(raw.apiKey as string, 'apiKey'),
    branchId: ensure(raw.branchId as string, 'branchId'),
    tenantId: ensure(raw.tenantId as string, 'tenantId'),
    mode: ((raw.mode as 'live' | 'mock' | undefined) ?? 'live'),
    timeoutMs: (raw.timeoutMs as number | undefined) ?? 8000,
  };
}

function stableUuid(tenantId: string, posId: string): string {
  const h = createHash('sha1').update(`${tenantId}:${posId}`).digest('hex');
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    `5${h.slice(13, 16)}`,
    `8${h.slice(17, 20)}`,
    h.slice(20, 32),
  ].join('-');
}

async function rest<T>(
  cfg: AdisyoConfig,
  method: 'GET' | 'POST' | 'PUT',
  pathname: string,
  body?: unknown,
): Promise<T> {
  if (cfg.mode === 'mock') {
    return mockResponse<T>(method, pathname);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
  try {
    const url = `${cfg.baseUrl}${pathname}`;
    const res = await fetch(url, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-api-key': cfg.apiKey,
        'x-branch-id': cfg.branchId,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const retryable = res.status >= 500 || res.status === 429;
      throw new PosAdapterError(`Adisyo HTTP ${res.status}`, retryable);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof PosAdapterError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new PosAdapterError('Adisyo timeout', true, err);
    }
    throw new PosAdapterError(
      err instanceof Error ? err.message : 'Adisyo unknown error',
      true,
      err,
    );
  } finally {
    clearTimeout(timer);
  }
}

function mockResponse<T>(method: string, pathname: string): T {
  if (method === 'POST' && pathname.includes('/orders')) {
    return { orderId: `mock-adisyo-${Date.now()}` } as T;
  }
  if (method === 'PUT' && pathname.includes('/payment')) {
    return { ok: true } as T;
  }
  if (method === 'GET' && pathname.includes('/menu/items')) {
    return {
      items: [
        { id: 'A-1', name: 'Mock Mantı', priceTL: 180, categoryName: 'Mock' },
      ],
    } as T;
  }
  if (method === 'GET' && pathname.includes('/health')) {
    return { ok: true } as T;
  }
  return {} as T;
}

export class AdisyoAdapter implements PosAdapter {
  readonly type = 'adisyo_api' as const;
  private readonly cfg: AdisyoConfig;

  constructor(config: PosConfig) {
    this.cfg = parseConfig(config);
  }

  async pushOrder(order: Order, tableLabel: string): Promise<PosOrderId> {
    const payload = {
      externalId: order.id,
      tableName: tableLabel,
      branchId: this.cfg.branchId,
      items: order.lines.map((l) => ({
        productId: l.menuItemId,
        quantity: l.qty,
        unitPrice: l.unitPriceKurus / 100,
        note: l.note ?? '',
        modifiers: l.modifiers ?? [],
      })),
    };
    const res = await rest<{ orderId: string }>(this.cfg, 'POST', '/v1/orders', payload);
    return res.orderId;
  }

  async markPaid(posOrderId: PosOrderId, payment: PaymentMeta): Promise<void> {
    await rest<{ ok: boolean }>(
      this.cfg,
      'PUT',
      `/v1/orders/${encodeURIComponent(posOrderId)}/payment`,
      {
        method: payment.method,
        amount: payment.amountKurus / 100,
        tip: payment.tipKurus / 100,
        externalRef: payment.gatewayTxId,
      },
    );
  }

  async syncMenu(): Promise<MenuSnapshot> {
    const data = await rest<{
      items: Array<{ id: string; name: string; priceTL: number; categoryName: string }>;
    }>(this.cfg, 'GET', '/v1/menu/items');
    const capturedAt = new Date().toISOString();
    return {
      tenantId: this.cfg.tenantId,
      capturedAt,
      items: data.items.map((it) => ({
        id: stableUuid(this.cfg.tenantId, it.id),
        tenantId: this.cfg.tenantId,
        conceptId: null,
        nameTr: it.name,
        hidden: false,
        cachedPriceKurus: Math.round(it.priceTL * 100),
        posLink: {
          posProductId: it.id,
          posName: it.name,
          posPriceKurus: Math.round(it.priceTL * 100),
          lastSyncedAt: capturedAt,
        },
      })),
    };
  }

  async healthCheck(): Promise<AdapterHealth> {
    const started = Date.now();
    try {
      await rest<{ ok: boolean }>(this.cfg, 'GET', '/v1/health');
      return {
        ok: true,
        latencyMs: Date.now() - started,
        lastSuccessAt: new Date().toISOString(),
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - started,
        lastError: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
