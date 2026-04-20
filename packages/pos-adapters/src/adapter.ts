/**
 * POS adapter sözleşmesi (docs/integrations/POS_ADAPTERS.md).
 *
 * Segment B: mevcut POS'u olan restoranlar. Odoo modülü (`hashtap_pos`)
 * siparişi oluşturduktan sonra ilgili adapter'ı çağırır. Üst katman hangi
 * adapter'ın altta ne yaptığını bilmez. Adapter'lar idempotent olmalı:
 * aynı sipariş iki kez push edilirse aynı pos_order_id dönmeli.
 */

import type { MenuSnapshot, Order, PosConnectionType } from '@hashtap/shared';

export type PosOrderId = string;

export type PaymentMeta = {
  method: 'card' | 'apple_pay' | 'google_pay';
  amountKurus: number;
  tipKurus: number;
  gatewayTxId: string;
};

export type AdapterHealth = {
  ok: boolean;
  latencyMs?: number;
  lastError?: string;
  lastSuccessAt?: string;
};

export interface PosAdapter {
  readonly type: PosConnectionType;

  pushOrder(order: Order, tableLabel: string): Promise<PosOrderId>;
  markPaid(posOrderId: PosOrderId, payment: PaymentMeta): Promise<void>;
  syncMenu(): Promise<MenuSnapshot>;
  healthCheck(): Promise<AdapterHealth>;
}

export class PosAdapterError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'PosAdapterError';
  }
}
