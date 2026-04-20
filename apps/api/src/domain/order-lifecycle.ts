/**
 * Sipariş yaşam döngüsü motoru. Event-driven geçişler.
 *
 * created → paid → sent_to_pos → in_kitchen → ready → served
 *                → cancelled (ödeme öncesi iptal, mutfak başlamadan)
 *                → refunded (ödeme sonrası iade)
 *
 * Her geçiş idempotent. Webhook/retry güvenli olmalı.
 * POS'a yazma adımı mutfağa etkileyen yan etki — sadece "paid" durumundan sonra.
 */

import type { OrderStatus } from './types.js';

const transitions: Record<OrderStatus, OrderStatus[]> = {
  created: ['paid', 'cancelled'],
  paid: ['sent_to_pos', 'refunded'],
  sent_to_pos: ['in_kitchen', 'refunded'],
  in_kitchen: ['ready', 'refunded'],
  ready: ['served'],
  served: [],
  cancelled: [],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from].includes(to);
}
