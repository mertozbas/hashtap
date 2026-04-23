import { describe, it, expect } from 'vitest';
import { AdisyoAdapter } from '../adisyo.js';
import type { Order } from '@hashtap/shared';

const TENANT = '00000000-0000-0000-0000-000000000001';
const ORDER_ID = '00000000-0000-0000-0000-00000000aaaa';
const ITEM_ID = '00000000-0000-0000-0000-00000000bbbb';

function mockCfg() {
  return {
    baseUrl: 'https://example.invalid',
    apiKey: 'k',
    branchId: 'b1',
    tenantId: TENANT,
    mode: 'mock' as const,
  };
}

function sampleOrder(): Order {
  return {
    id: ORDER_ID,
    tenantId: TENANT,
    tableId: null,
    status: 'created',
    totalKurus: 5000,
    lines: [{ menuItemId: ITEM_ID, qty: 1, unitPriceKurus: 5000 }],
    paymentId: null,
    posOrderId: null,
    createdAt: new Date().toISOString(),
    paidAt: null,
  };
}

describe('AdisyoAdapter (mock mode)', () => {
  it('pushOrder mock returns an id', async () => {
    const adapter = new AdisyoAdapter(mockCfg());
    const id = await adapter.pushOrder(sampleOrder(), '2');
    expect(id).toMatch(/^mock-adisyo-/);
  });

  it('markPaid mock completes', async () => {
    const adapter = new AdisyoAdapter(mockCfg());
    await expect(
      adapter.markPaid('mock-adisyo-42', {
        method: 'card',
        amountKurus: 5000,
        tipKurus: 0,
        gatewayTxId: 'iyz-2',
      }),
    ).resolves.not.toThrow();
  });

  it('syncMenu mock returns valid MenuSnapshot', async () => {
    const adapter = new AdisyoAdapter(mockCfg());
    const snap = await adapter.syncMenu();
    expect(snap.tenantId).toBe(TENANT);
    expect(snap.items.length).toBeGreaterThan(0);
  });

  it('healthCheck mock returns ok', async () => {
    const adapter = new AdisyoAdapter(mockCfg());
    const h = await adapter.healthCheck();
    expect(h.ok).toBe(true);
  });

  it('throws config error when branchId missing', () => {
    expect(() => new AdisyoAdapter({ ...mockCfg(), branchId: '' })).toThrow(/branchId/);
  });
});
