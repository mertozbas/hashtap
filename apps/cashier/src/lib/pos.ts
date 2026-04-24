export type TableStatus = 'free' | 'open' | 'occupied' | 'ready';

export interface PosTable {
  id: number;
  name: string;
  identifier: string;
  floor: string;
  seats: number;
  slug: string;
  status: TableStatus;
  active_order_count: number;
  active_total_kurus: number;
}

export type OrderState =
  | 'placed'
  | 'paid'
  | 'kitchen_sent'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'cancelled';

export type PaymentState = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';

export type EarsivState = 'not_required' | 'pending' | 'issued' | 'failed';

export interface PosOrderLine {
  id: number;
  item_id: number;
  item_name: string;
  quantity: number;
  unit_price_kurus: number;
  modifier_total_kurus: number;
  subtotal_kurus: number;
  note: string;
}

export interface PosOrder {
  id: number;
  reference: string;
  state: OrderState;
  payment_state: PaymentState;
  payment_method_code: string;
  earsiv_state: EarsivState;
  paid_amount_kurus: number;
  subtotal_kurus: number;
  total_kurus: number;
  currency: string;
  table_id: number;
  table_slug: string;
  table_name: string;
  customer_note: string;
  created_at: string | null;
  kitchen_fired_at: string | null;
  ready_at: string | null;
  lines: PosOrderLine[];
}

export interface TableDetailResponse {
  table: Pick<PosTable, 'id' | 'name' | 'identifier' | 'floor' | 'seats' | 'slug'>;
  orders: PosOrder[];
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchTables(): Promise<PosTable[]> {
  const body = await json<{ tables: PosTable[] }>(await fetch('/v1/pos/tables'));
  return body.tables;
}

export async function fetchTableDetail(tableId: number): Promise<TableDetailResponse> {
  return json<TableDetailResponse>(await fetch(`/v1/pos/tables/${tableId}`));
}

export async function fetchActiveOrders(): Promise<PosOrder[]> {
  const body = await json<{ orders: PosOrder[] }>(await fetch('/v1/pos/orders?state=active'));
  return body.orders;
}

export async function fetchOrder(orderId: number): Promise<PosOrder> {
  const body = await json<{ order: PosOrder }>(await fetch(`/v1/pos/orders/${orderId}`));
  return body.order;
}

interface SubmitLine {
  item_id: number;
  quantity: number;
  note?: string;
}

export interface SubmitOrderPayload {
  table_id: number;
  items: SubmitLine[];
  customer_note?: string;
  require_receipt?: boolean;
}

export async function submitOrder(payload: SubmitOrderPayload): Promise<PosOrder> {
  const res = await fetch('/v1/pos/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await json<{ order?: PosOrder; error?: string }>(res);
  if (body.error) throw new Error(body.error);
  if (!body.order) throw new Error('no_order_in_response');
  return body.order;
}

export async function fireKitchen(orderId: number): Promise<PosOrder> {
  const res = await fetch(`/v1/pos/orders/${orderId}/fire`, { method: 'POST' });
  const body = await json<{ order?: PosOrder; error?: string; detail?: string }>(res);
  if (body.error) throw new Error(body.detail || body.error);
  if (!body.order) throw new Error('no_order');
  return body.order;
}

export async function advanceOrder(orderId: number): Promise<PosOrder> {
  const res = await fetch(`/v1/pos/orders/${orderId}/advance`, { method: 'POST' });
  const body = await json<{ order?: PosOrder; error?: string }>(res);
  if (body.error) throw new Error(body.error);
  if (!body.order) throw new Error('no_order');
  return body.order;
}

export async function cancelOrder(orderId: number): Promise<PosOrder> {
  const res = await fetch(`/v1/pos/orders/${orderId}/cancel`, { method: 'POST' });
  const body = await json<{ order?: PosOrder; error?: string }>(res);
  if (body.error) throw new Error(body.error);
  if (!body.order) throw new Error('no_order');
  return body.order;
}

export type PaymentMethodCode = 'cash' | 'pay_at_counter' | 'card_manual';

export async function payOffline(
  orderId: number,
  methodCode: PaymentMethodCode,
): Promise<PosOrder> {
  const res = await fetch(`/v1/pos/orders/${orderId}/pay`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ method_code: methodCode }),
  });
  const body = await json<{ order?: PosOrder; error?: string }>(res);
  if (body.error) throw new Error(body.error);
  if (!body.order) throw new Error('no_order');
  return body.order;
}
