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

export interface PosOrderLineModifier {
  id: number;
  name: { tr: string; en: string };
  price_delta_kurus: number;
}

export interface PosOrderLine {
  id: number;
  item_id: number;
  item_name: string;
  quantity: number;
  unit_price_kurus: number;
  modifier_total_kurus: number;
  subtotal_kurus: number;
  modifier_ids: number[];
  modifiers: PosOrderLineModifier[];
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

export interface SubmitLine {
  item_id: number;
  quantity: number;
  modifier_ids?: number[];
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

export async function addOrderLines(
  orderId: number,
  items: SubmitLine[],
): Promise<PosOrder> {
  const res = await fetch(`/v1/pos/orders/${orderId}/lines`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  const body = await json<{ order?: PosOrder; error?: string }>(res);
  if (body.error) throw new Error(body.error);
  if (!body.order) throw new Error('no_order');
  return body.order;
}

export async function updateOrderLine(
  orderId: number,
  lineId: number,
  changes: { quantity?: number; note?: string; delete?: boolean },
): Promise<PosOrder> {
  const res = await fetch(`/v1/pos/orders/${orderId}/lines/${lineId}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(changes),
  });
  const body = await json<{ order?: PosOrder; error?: string }>(res);
  if (body.error) throw new Error(body.error);
  if (!body.order) throw new Error('no_order');
  return body.order;
}

export interface BillSplit {
  amount_kurus: number;
  method_code: PaymentMethodCode;
}

export async function splitBill(
  orderId: number,
  splits: BillSplit[],
): Promise<PosOrder> {
  const res = await fetch(`/v1/pos/orders/${orderId}/split`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ splits }),
  });
  const body = await json<{ order?: PosOrder; error?: string }>(res);
  if (body.error) throw new Error(body.error);
  if (!body.order) throw new Error('no_order');
  return body.order;
}

export interface DaySummaryMethod {
  method_code: string;
  order_count: number;
  total_kurus: number;
}

export interface DaySummary {
  day: string;
  totals: {
    order_count: number;
    paid_count: number;
    open_count: number;
    gross_kurus: number;
    collected_kurus: number;
    unpaid_kurus: number;
  };
  by_method: DaySummaryMethod[];
}

export async function fetchDaySummary(day?: string): Promise<DaySummary> {
  const q = day ? `?day=${encodeURIComponent(day)}` : '';
  return json<DaySummary>(await fetch(`/v1/pos/day/summary${q}`));
}

export interface DayClosureRow {
  id: number;
  day: string | null;
  order_count: number;
  gross_kurus: number;
  collected_kurus: number;
  cash_system_kurus: number;
  cash_counted_kurus: number;
  diff_kurus: number;
  note: string;
  closed_at: string | null;
}

export async function fetchDayClosures(): Promise<DayClosureRow[]> {
  const body = await json<{ closures: DayClosureRow[] }>(
    await fetch('/v1/pos/day/closures'),
  );
  return body.closures;
}

export async function closeDay(
  day: string,
  cashCountedKurus: number,
  note: string = '',
): Promise<{ z_report_id: number; diff_kurus: number | null }> {
  const res = await fetch('/v1/pos/day/close', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ day, cash_counted_kurus: cashCountedKurus, note }),
  });
  const body = await json<{
    z_report_id?: number;
    diff_kurus?: number | null;
    error?: string;
  }>(res);
  if (body.error) throw new Error(body.error);
  if (typeof body.z_report_id !== 'number') throw new Error('no_z_report');
  return {
    z_report_id: body.z_report_id,
    diff_kurus: body.diff_kurus ?? null,
  };
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
