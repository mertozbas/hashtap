import type { MenuSnapshot, Order } from '@hashtap/shared';
import type { AdapterHealth, PaymentMeta, PosAdapter, PosOrderId } from '../adapter.js';
import type { PosConfig } from '../registry.js';

/**
 * Print Bridge adapter.
 * Restoranın POS'u yok ya da API'ye kapalı. Mutfak/bar yazıcılarına ESC/POS ile
 * doğrudan fiş basmak için Raspberry Pi ya da ağ yazıcısı kullanıyoruz.
 *
 * Cihaz buluttan WebSocket ile sipariş çeker; bu sınıf sadece komut yayınlar.
 * "Menü senkronu" yoktur — Print Bridge senaryosunda menü tek kaynak HashTap'tır.
 */
export class PrintBridgeAdapter implements PosAdapter {
  readonly type = 'print_bridge' as const;

  constructor(private readonly config: PosConfig) {}

  async pushOrder(_order: Order, _tableLabel: string): Promise<PosOrderId> {
    throw new Error('PrintBridgeAdapter.pushOrder: not implemented');
  }

  async markPaid(_posOrderId: PosOrderId, _payment: PaymentMeta): Promise<void> {
    return;
  }

  async syncMenu(): Promise<MenuSnapshot> {
    throw new Error('Print Bridge has no POS to sync from — HashTap is the source');
  }

  async healthCheck(): Promise<AdapterHealth> {
    return { ok: false, lastError: 'not implemented' };
  }
}
