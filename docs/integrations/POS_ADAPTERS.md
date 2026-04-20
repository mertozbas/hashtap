# POS Adapter'ları (Segment B)

Bu doküman kendi POS'unu korumak isteyen restoranlara (Segment B) hizmet vermek için kullanılan adapter katmanını tanımlar. Segment A (POS'u olmayan veya HashTap'in ERP'sine geçen) müşteriler için bu doküman gereksiz.

## 1. Ne zaman devreye girer

Yeni bir kiracı onboarding'de iki seçenekten biri:
- **HashTap Native mod:** Odoo + `hashtap_pos` her şeyi yönetir. Varsayılan mod.
- **Adapter mod:** Kiracı kendi POS'unu tutar (SambaPOS, Adisyo, vs). Odoo sipariş kayıt etse de iş mantığı (mutfak fişi, stok, Z raporu) kiracının POS'unda çalışır. HashTap QR/ödeme/e-Arşiv katmanıdır.

Kiracı ayarlardan `hashtap_pos_mode` seçer: `hashtap_native | adapter_sambapos | adapter_adisyo | adapter_local_agent | adapter_db_connector | adapter_print_bridge | adapter_network_printer`.

## 2. Adapter modunda davranış farkı

Adapter mod aktifken:
- Odoo'nun KDS'si devre dışı (PWA siparişi Odoo'ya da yazılır ama mutfağa Odoo üzerinden basılmaz).
- Sipariş adapter'a forward edilir.
- Adapter POS'ta sipariş açar, kendi mutfağını tetikler.
- HashTap `pos.order` yine kalır — rapor/ciro/arşiv için.
- iyzico ve e-Arşiv hâlâ HashTap'in işidir (Segment B müşterisi bunlar için HashTap'i zaten seçti).

## 3. Adapter tipleri

### 3.1 `adapter_sambapos`
**Nasıl:** SambaPOS'un Graph API'si (v5+).
**Önkoşul:** Restoranın SambaPOS'unda "Graph API" özelliği aktif + ağdan ulaşılabilir (veya HashTap'e webhook relay).
**Artı:** Zengin iş mantığı (adisyon, masa, modifier) hazır.
**Eksi:** SambaPOS ağ üzerinden açmak güvenlik endişesi; çoğunda VPN/port-forward gerekir.
**Alternatif:** Restoranın SambaPOS sunucusuna bir küçük HashTap ajanı (local-agent) koyup lokal olarak API'ye konuşsun; dışa sadece HashTap ile HTTPS.

### 3.2 `adapter_adisyo`
**Nasıl:** Adisyo REST API. Adisyo zaten bulut tabanlı, API public.
**Artı:** Ağ erişim derdi yok.
**Eksi:** API kotası, gecikmeler. Adisyo'nun resmi "iş ortağı" programı var mı? — satış tarafı netleştirmeli.

### 3.3 `adapter_local_agent`
**Nasıl:** Windows servisi olarak çalışan küçük bir HashTap ajanı, restoranın yerel ağında. POS'un DB'sine veya API'sine lokal ulaşır; HashTap API'ye outbound HTTPS.
**Kimler için:** SambaPOS, Logo, Mikro — API'si olmayan veya internet'e açılamayan POS'lar.
**Zorluk:** Windows'ta kurulum, update, support. MVP sonrası iş.

### 3.4 `adapter_db_connector`
**Nasıl:** POS'un veritabanına (MSSQL, MySQL) doğrudan yazma.
**Kimler için:** Hiçbir API'si olmayan eski POS.
**Risk:** Çok kırılgan. Son çare.

### 3.5 `adapter_print_bridge`
**Nasıl:** POS yok; doğrudan mutfak yazıcısına ESC/POS.
**Segment A'da da aynı:** Bu modda HashTap aslında "ERP'siz" çalışır — kiracı işletme defterini kendisi tutar.
**Kullanım senaryosu:** Küçük kafe, "ben bu kadar sistemi istemiyorum, sadece QR + fiş mutfak + iyzico + e-Arşiv yeter".

### 3.6 `adapter_network_printer`
**Nasıl:** Eski sistemde IP'li yazıcıya direkt bas. Print-bridge'e bile gerek yok.
**Kimler için:** Ağda network printer varsa, Pi kurmaya gerek yok.

## 4. Adapter arayüzü

Adapter'lar Python'da `hashtap_pos/services/pos_adapter.py` arayüzünü uygular. Not: bazı adapter'lar (local-agent, sambapos API) Python'da; bazıları TS mikroservis (`packages/pos-adapters`'taki gibi). Python arayüzü uniform, altında HTTP çağrısıyla TS servise gidebilir.

```python
class PosAdapter(Protocol):
    def push_order(self, order: PosOrder) -> PosOrderRef: ...
    def update_status(self, order_ref: PosOrderRef, status: str) -> None: ...
    def sync_menu(self) -> MenuSnapshot: ...
    def health_check(self) -> AdapterHealth: ...
```

### 4.1 `push_order`
- Sipariş payload'ını POS'a yollar.
- Idempotent — aynı `pos.order.id` ikinci kez yollanırsa POS'ta tekrar açılmaz.
- POS'taki sipariş referansını (`PosOrderRef`) dönüp Odoo'da saklar.

### 4.2 `update_status`
- Ödeme alındı, iptal edildi, iade edildi — POS'a bildir.
- Bazı POS'lar bunu desteklemez (sadece "sipariş oluştur" bilirler); bu durumda no-op.

### 4.3 `sync_menu`
- POS'un menüsünü çek (iş gerçeği orada).
- `hashtap.menu.item`'ları upsert et: SKU eşleşir → sadece HashTap alanları (foto, i18n) dokunulmaz; fiyat/KDV POS'tan güncellenir.
- Günlük cron + manuel trigger.

### 4.4 `health_check`
- POS'a bağlantı kurulabiliyor mu?
- Son başarılı sipariş push'u ne zamandı?
- Kuyrukta bekleyen kaç event var?
- Panelde "POS bağlantısı" göstergesi.

## 5. Menü sahipliği — adapter modunda

Segment A'da menü HashTap'in (Odoo), iş gerçeği (fiyat, KDV, SKU) de HashTap'in.

Segment B'de menü **POS'un** — HashTap okur, üstüne sadece sunum (foto, i18n, açıklama) ekler.

### Menü sync kuralları
- POS'tan çekilen fiyat HashTap'te salt-okunur (`list_price` read-only for adapter mode).
- POS'ta olmayan bir item HashTap'te de görünmez.
- HashTap'te eklenen bir item (örn bir kampanya) POS'a yazılmaz — POS zaten bilmiyor, "sanal" item sayılır; MVP'de bu özellik yok.
- Fiyat değişikliği POS'tan gelir: HashTap günlük sync'te fiyat güncellenir. "Canlı" fiyat senkronu (her QR açılışında POS'a sor) ağır — sadece `sync_menu` cron'una güveniriz.

## 6. Siparişin iki tarafta durumu

Adapter modunda `pos.order` durum geçişleri biraz farklı:

```
pending_payment ─► paid ──► pushed_to_external_pos ──► external_pos_accepted ──► kitchen_fired (POS tarafında)
                    │
                    └─► paid_no_receipt (e-Arşiv fail — mutfak/POS tetiklenmez)
```

`pushed_to_external_pos` ve `external_pos_accepted` arası adapter'ın "POS'a yolladım, onay bekliyorum" fazı. Timeout 30 saniye; timeout olursa retry, kalıcı fail ise kritik alarm.

## 7. Hata senaryoları

| Senaryo | Davranış |
|---|---|
| POS offline (SambaPOS kapatılmış) | Queue'da bekle; POS açılınca push et. |
| POS'ta "item not found" (menü senkron farklı) | Alarm + manuel müdahale. Otomatik menü sync'i tetikle. |
| Idempotency ihlali (POS aynı siparişi iki kez açar) | Adapter log'dan bir şey tespit edilemez — duplicate'ı POS operatörüne bildirim olarak bırakırız. |
| POS fiyatı ile HashTap fiyatı farklı | HashTap'in kullandığı fiyat geçerli (sunucu tarafı validation). POS'a doğru fiyat zaten push'lanıyor — Fark zaten kapatılır. |
| `sync_menu` başarısız | Eski menüyle devam; panel uyarısı. |

## 8. Faz 0'dan devreden kod

`packages/pos-adapters/` dizinindeki TS kodu kalır ama rolü değişir:
- Eski rol: HashTap API'nin direkt kullandığı sipariş push'u (artık Odoo yapar).
- Yeni rol: Bazı adapter tiplerinde (network printer, local agent) TS mikroservis — Odoo HTTP ile çağırır.

Faz 7'de adapter implementasyonları detaylı yazılır.

## 9. Test stratejisi

- **Mock POS:** Her adapter tipi için bir mock server (`packages/pos-adapters/mocks/`).
- **Integration:** Odoo → mock → durum doğrulaması.
- **Pilot test:** Gerçek SambaPOS / Adisyo hesabı ile sandbox (sağlayıcılarla işbirliği).

## 10. Açık sorular

- SambaPOS Graph API için lisans/sözleşme — resmi partner statüsü gerekebilir.
- Adisyo resmi "app marketplace" açar mı? HashTap orada listelenirse onboarding hızlanır.
- `adapter_db_connector` için hangi POS'lara destek verilecek? — MVP'de yok; müşteri talebi gelirse konuşulur.
- Menü sync'in yönü: tek yönlü (POS→HashTap) MVP; iki yönlü MVP dışı. Müşteri "menüyü HashTap'ten yönetmek istiyorum ve POS'uma da yazılsın" derse faz 2+.
