import type { MenuSnapshot, Order } from '@hashtap/shared';
import type { AdapterHealth, PaymentMeta, PosAdapter, PosOrderId } from '../adapter.js';
import type { PosConfig } from '../registry.js';

/**
 * Yerel PC ajanı bridge.
 * Restoranın POS bilgisayarına (Mikro, Logo, Profit gibi kapalı kutular için)
 * küçük bir Windows servisi kuruyoruz. Servis buluttan WebSocket ile sipariş
 * çeker, yerel DB'ye ya da RPC'ye yazar.
 *
 * Bu adapter buluttaki tarafı temsil eder: komutu WebSocket kuyruğuna bırakır,
 * ajan çeker. Durum webhook ile geri döner.
 */
export class LocalAgentAdapter implements PosAdapter {
  readonly type = 'local_agent' as const;

  constructor(private readonly config: PosConfig) {}

  async pushOrder(_order: Order, _tableLabel: string): Promise<PosOrderId> {
    throw new Error('LocalAgentAdapter.pushOrder: not implemented');
  }

  async markPaid(_posOrderId: PosOrderId, _payment: PaymentMeta): Promise<void> {
    throw new Error('LocalAgentAdapter.markPaid: not implemented');
  }

  async syncMenu(): Promise<MenuSnapshot> {
    throw new Error('LocalAgentAdapter.syncMenu: not implemented');
  }

  async healthCheck(): Promise<AdapterHealth> {
    return { ok: false, lastError: 'not implemented' };
  }
}
