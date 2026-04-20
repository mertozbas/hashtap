# @hashtap/pos-adapters

Restoran POS/ERP sistemlerine bağlantı adapter'ları. Her yöntem aynı `PosAdapter` arayüzünü uygular.

## Neden birden fazla adapter?

Restoranların kullandığı sistem çok çeşitli — tek API ile hepsini çözemeyiz. Bu paket **bağlantı yöntemleri kütüphanesi** olarak çalışır; onboarding sırasında restorana göre uygun adapter seçilir.

## Mevcut adapter'lar

| Adapter | Ne zaman | Durum |
|---------|----------|-------|
| `SambaPosAdapter` | SambaPOS v5 Messaging API | stub |
| `AdisyoAdapter` | Adisyo REST API | stub |
| `LocalAgentAdapter` | Mikro, Logo, Profit — yerel PC ajanı + WebSocket | stub |
| `PrintBridgeAdapter` | POS yok; Raspberry Pi + ESC/POS | stub |
| `network_printer` | Print Bridge'in cihazsız varyantı | stub |
| `db_connector` | Son çare: POS DB'sine doğrudan yazma | yok |

## Arayüz

```ts
interface PosAdapter {
  pushOrder(order: Order, table: string): Promise<PosOrderId>;   // idempotent olmalı
  markPaid(posOrderId: PosOrderId, payment: PaymentMeta): Promise<void>;
  syncMenu(): Promise<MenuSnapshot>;   // Print Bridge hariç
  healthCheck(): Promise<AdapterHealth>;
}
```

`pushOrder` idempotent: aynı `order.id` ile iki kez çağrılırsa aynı `PosOrderId` dönmeli, POS'ta kopya adisyon yaratılmamalı. Retry/webhook yeniden gönderim güvenliği buna bağlı.

## Yeni adapter eklemek

1. `src/adapters/<posname>.ts` yaz, `PosAdapter` implement et.
2. `src/registry.ts` içine factory ekle.
3. `@hashtap/shared` `PosConnectionType` enum'una değer ekle.
4. Test: `src/adapters/__tests__/<posname>.spec.ts`.
