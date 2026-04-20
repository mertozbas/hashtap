import { z } from 'zod';
import type { Kurus } from './money.js';

export const OrderStatus = z.enum([
  'created',
  'paid',
  'sent_to_pos',
  'in_kitchen',
  'ready',
  'served',
  'cancelled',
  'refunded',
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

export const OrderLineSchema = z.object({
  menuItemId: z.string().uuid(),
  qty: z.number().int().positive(),
  unitPriceKurus: z.number().int().nonnegative(),
  modifiers: z.array(z.string()).optional(),
  note: z.string().max(300).optional(),
});
export type OrderLine = z.infer<typeof OrderLineSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  tableId: z.string().uuid().nullable(),
  status: OrderStatus,
  totalKurus: z.number().int(),
  lines: z.array(OrderLineSchema),
  paymentId: z.string().nullable(),
  posOrderId: z.string().nullable(),
  createdAt: z.string().datetime(),
  paidAt: z.string().datetime().nullable(),
});
export type Order = z.infer<typeof OrderSchema>;

export type OrderTotal = { subtotalKurus: Kurus; tipKurus: Kurus; totalKurus: Kurus };
