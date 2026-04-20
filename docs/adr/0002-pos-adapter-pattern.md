# ADR-0002 — POS adapter pattern

- Durum: kabul
- Tarih: 2026-04-20

## Bağlam

Türkiye restoran pazarında POS manzarası parçalı: SambaPOS, Adisyo, Logo, Mikro, ayrıca hiç POS kullanmayan küçük işletmeler. HashTap'in ticari varsayımı "hangi POS olursa olsun entegre olabiliriz." Bu yüzden bağlanma yöntemi kodun çekirdeğinden ayrılmalı.

## Karar

Tek bir `PosAdapter` arayüzü (`packages/pos-adapters/src/adapter.ts`):

```ts
interface PosAdapter {
  readonly type: PosConnectionType;
  pushOrder(order: Order, tableLabel: string): Promise<PosOrderId>;
  markPaid(posOrderId: PosOrderId, payment: PaymentMeta): Promise<void>;
  syncMenu(): Promise<MenuSnapshot>;
  healthCheck(): Promise<AdapterHealth>;
}
```

Her bağlantı tipi bu arayüzü uygular:

| Tip | Kullanım |
|-----|----------|
| `sambapos_api` | SambaPOS GraphQL/HTTP |
| `adisyo_api` | Adisyo REST API |
| `local_agent` | Restoranın ağında çalışan küçük Windows servisi |
| `db_connector` | Doğrudan POS veritabanına yazma (son çare) |
| `print_bridge` | POS'suz; direkt mutfak yazıcısına |
| `network_printer` | Eski sistemde yazıcı IP'si bilinen özel case |

Factory: `createPosAdapter(type, config)` — tenant kaydındaki tipe göre doğru implementation'ı döner.

## Gerekçe

- Yeni POS eklemek tek dosya değişikliği.
- Worker layer (pg-boss) adapter'ı tanımaz; sadece arayüze konuşur.
- Her adapter tek başına test edilebilir, feature flag'lenebilir.

## Sonuç

- `+` Satış ekibi "şu POS'u destekliyor musunuz?" sorusuna kısa sürede evet diyebilir.
- `+` İş mantığı adapter'dan bağımsız test edilir.
- `−` Arayüz çok gevşek kalırsa her adapter ayrı semantik geliştirebilir; bunu önlemek için paylaşılan şemaları `packages/shared` altında tutuyoruz.
