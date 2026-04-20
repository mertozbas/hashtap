# @hashtap/pos-adapters

Segment B — **mevcut POS'u olan restoranlar** — için bağlantı adapter'ları. Detay: [`docs/integrations/POS_ADAPTERS.md`](../../docs/integrations/POS_ADAPTERS.md).

## Kapsam

Segment A (HashTap native Odoo) adapter'a ihtiyaç duymaz; sipariş doğrudan `pos.order` olarak Odoo'da oluşur. Bu paket sadece Segment B'de devreye girer: Odoo `hashtap_pos` modülü siparişi kaydettikten sonra tenant'ın `pos_mode`'una göre buradaki adapter'lardan birini çağırır.

## Adapter tipleri

POS_ADAPTERS.md §3'te tanımlanan 6 tip:

| Adapter | Ne zaman | Durum |
|---------|----------|-------|
| `sambapos` | SambaPOS v5 Messaging API | stub |
| `adisyo` | Adisyo REST API | stub |
| `local_agent` | Mikro, Logo, Profit — yerel PC ajanı + WebSocket | stub |
| `db_connector` | Son çare: POS DB'sine doğrudan yazma | stub |
| `print_bridge` | POS yok, `apps/print-bridge` Raspberry Pi ajanı | stub |
| `network_printer` | Print Bridge'in cihazsız varyantı (lokal IP'li yazıcı) | stub |

## Arayüz

```ts
interface PosAdapter {
  readonly type: PosConnectionType;
  pushOrder(order: Order, tableLabel: string): Promise<PosOrderId>;   // idempotent
  markPaid(posOrderId: PosOrderId, payment: PaymentMeta): Promise<void>;
  syncMenu(): Promise<MenuSnapshot>;            // print_bridge hariç
  healthCheck(): Promise<AdapterHealth>;
}
```

`pushOrder` idempotent: aynı `order.id` ile iki kez çağrılırsa aynı `PosOrderId` dönmeli, POS'ta kopya adisyon yaratılmamalı. Retry/webhook yeniden gönderim güvenliği buna bağlı.

## Python'dan çağrı

Segment B akışında Odoo modülü adapter'ı doğrudan Python'dan mı yoksa gateway üzerinden mi çağırır — bu karar ROADMAP Faz 7'de veriliyor. Muhtemel plan: Odoo tarafında `queue_job` → HTTP out → Node adapter süreci (`@hashtap/pos-adapters`'ı saran bir küçük servis). Bu paketin API'si iki senaryoda da değişmiyor.

## Yeni adapter eklemek

1. `src/adapters/<posname>.ts` yaz, `PosAdapter` implement et.
2. `src/registry.ts` içine factory ekle.
3. `@hashtap/shared` `PosConnectionType` enum'una değer ekle.
4. Test: `src/adapters/__tests__/<posname>.spec.ts`.
