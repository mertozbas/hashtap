# ADR-0003 — Para birimi integer (Kurus)

- Durum: kabul (kapsam daraltıldı 2026-04-20 — Odoo-tabanlı mimariye uyum)
- Tarih: 2026-04-20

> **Kapsam notu:** ADR-0004 sonrası iş mantığının çoğu Odoo'ya taşındı. Odoo para alanlarını kendi `fields.Monetary` (decimal) tipiyle yönetir — bu kural Odoo içinde **geçerli değil**. `Kurus` tipi sadece **TS katmanında** (gateway + customer-pwa) + Odoo ↔ dış dünya sınırındaki serileştirmede kullanılır. Gateway'in Odoo'ya ve PWA'ya Kurus olarak geçip aldığı değer, Odoo içinde decimal'e dönüştürülür.

## Bağlam

Floating-point ile para işlemi yapmak sektörel bir antipattern. KDV bölünmesi, iskonto oranı, tip oranı gibi hesaplar `0.1 + 0.2 ≠ 0.3` tuzağına düşer. Ayrıca POS → HashTap → iyzico → e-Arşiv arasında yuvarlama farkı oluşursa mali mutabakat kırılır.

## Karar

Tüm para alanları `Kurus` = TL'nin 1/100'ü, `number` ama semantik olarak integer. Tipi `packages/shared/money.ts` içinde `brand` ile korunuyor. DB'de `integer` kolon.

Sunumda `trFormat(kurus)` → `"₺124,50"` helper'ı.
String → kurus çeviri `fromLiraString("124,50")` → `12450`.

## Sonuç

- `+` Toplam/indirim/KDV hesapları deterministik.
- `+` iyzico ve e-Arşiv'e gönderirken API'lerin beklediği biçime dönüşüm tek yerde.
- `−` Yabancı para eklenirse (USD/EUR) para birimi tipini de taşıyan bir `Money` yapısına geçmek gerekir. Şimdilik TRY varsayımıyla yaşıyoruz.
