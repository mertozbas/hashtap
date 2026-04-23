import { describe, it, expect } from 'vitest';
import { SambaPosAdapter } from '../sambapos.js';
import type { Order } from '@hashtap/shared';

const TENANT = '00000000-0000-0000-0000-000000000001';
const ORDER_ID = '00000000-0000-0000-0000-00000000aaaa';
const ITEM_ID = '00000000-0000-0000-0000-00000000bbbb';

function mockCfg() {
  return {
    endpoint: 'https://example.invalid/graphql',
    token: 'tok',
    terminalId: 't1',
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
    totalKurus: 10000,
    lines: [{ menuItemId: ITEM_ID, qty: 2, unitPriceKurus: 5000 }],
    paymentId: null,
    posOrderId: null,
    createdAt: new Date().toISOString(),
    paidAt: null,
  };
}

describe('SambaPosAdapter (mock mode)', () => {
  it('pushOrder mock returns deterministic-shaped id', async () => {
    const adapter = new SambaPosAdapter(mockCfg());
    const id = await adapter.pushOrder(sampleOrder(), '4');
    expect(id).toMatch(/^mock-samba-/);
  });

  it('markPaid mock completes without throwing', async () => {
    const adapter = new SambaPosAdapter(mockCfg());
    await expect(
      adapter.markPaid('mock-samba-123', {
        method: 'card',
        amountKurus: 10000,
        tipKurus: 500,
        gatewayTxId: 'iyz-1',
      }),
    ).resolves.not.toThrow();
  });

  it('syncMenu mock returns valid MenuSnapshot shape', async () => {
    const adapter = new SambaPosAdapter(mockCfg());
    const snap = await adapter.syncMenu();
    expect(snap.tenantId).toBe(TENANT);
    expect(Array.isArray(snap.items)).toBe(true);
    expect(snap.items[0]?.nameTr).toBeTruthy();
  });

  it('throws config error when tenantId missing', () => {
    expect(() => new SambaPosAdapter({ ...mockCfg(), tenantId: '' })).toThrow(/tenantId/);
  });
});
