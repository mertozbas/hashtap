/**
 * POS adapter sözleşmesi (docs/hashcash.md §4).
 *
 * Her bağlantı yöntemi ayrı bir adapter; üst katman hangisinin altta ne yaptığını
 * bilmez. Adapter'lar idempotent olmalı: aynı sipariş iki kez push edilirse aynı
 * pos_order_id dönmeli, kopya yaratılmamalı.
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
