import type { MenuSnapshot, Order } from '@hashtap/shared';
import type { AdapterHealth, PaymentMeta, PosAdapter, PosOrderId } from '../adapter.js';
import type { PosConfig } from '../registry.js';

/**
 * Adisyo REST API.
 * Dokümantasyon: https://adisyo.com/api (tenant başına API anahtarı).
 *
 * Çoklu şube desteği Adisyo'da şube ID ile yönetilir — config.branchId.
 */
export class AdisyoAdapter implements PosAdapter {
  readonly type = 'adisyo_api' as const;

  constructor(private readonly config: PosConfig) {}

  async pushOrder(_order: Order, _tableLabel: string): Promise<PosOrderId> {
    throw new Error('AdisyoAdapter.pushOrder: not implemented');
  }

  async markPaid(_posOrderId: PosOrderId, _payment: PaymentMeta): Promise<void> {
    throw new Error('AdisyoAdapter.markPaid: not implemented');
  }

  async syncMenu(): Promise<MenuSnapshot> {
    throw new Error('AdisyoAdapter.syncMenu: not implemented');
  }

  async healthCheck(): Promise<AdapterHealth> {
    return { ok: false, lastError: 'not implemented' };
  }
}
