import type { MenuSnapshot, Order } from '@hashtap/shared';
import type { AdapterHealth, PaymentMeta, PosAdapter, PosOrderId } from '../adapter.js';
import type { PosConfig } from '../registry.js';

/**
 * SambaPOS v5 Messaging API (GraphQL).
 * Dokümantasyon: https://doc.sambapos.com/
 *
 * Kurulum: restoranın SambaPOS sunucusunda messaging endpoint açık olmalı,
 * static terminal token bizde. Tenant başına config: { endpoint, token, terminalId }.
 */
export class SambaPosAdapter implements PosAdapter {
  readonly type = 'sambapos_api' as const;

  constructor(private readonly config: PosConfig) {}

  async pushOrder(_order: Order, _tableLabel: string): Promise<PosOrderId> {
    throw new Error('SambaPosAdapter.pushOrder: not implemented');
  }

  async markPaid(_posOrderId: PosOrderId, _payment: PaymentMeta): Promise<void> {
    throw new Error('SambaPosAdapter.markPaid: not implemented');
  }

  async syncMenu(): Promise<MenuSnapshot> {
    throw new Error('SambaPosAdapter.syncMenu: not implemented');
  }

  async healthCheck(): Promise<AdapterHealth> {
    return { ok: false, lastError: 'not implemented' };
  }
}
