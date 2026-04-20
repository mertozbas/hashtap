# ADR-0009 — Restoran paneli Odoo native (React'te değil)

- Durum: kabul
- Tarih: 2026-04-20
- İlgili: ADR-0004, ADR-0008, ADR-0007

## Bağlam

Faz 0'da `apps/restaurant-dashboard/` TS/React iskelesi yazılmıştı (siparişler, menü editörü, analiz, ayarlar). Odoo'ya geçince soru: panel Odoo'nun kendi arayüzünde mi yoksa ayrı React dashboard olarak mı kalacak?

Customer PWA için bu soruya "React'te kalsın" dedik (ADR-0008). Restoran paneli aynı mantıkla mı kalmalı?

## Alternatifler

### (A) Restoran paneli Odoo web client'ı (white-label)
**Artıları:**
- **Odoo bize bedava panel veriyor.** Menu form, list view, kanban, rapor — kutudan çıktığı gibi çalışıyor.
- **Geliştirme hızı:** Yeni iş modülü (örn stok yönetimi) Odoo native olunca ek UI yazmıyoruz.
- **Raporlar:** Odoo'nun grafik/pivot/Excel export altyapısı hazır. Özel bir BI UI yazmıyoruz.
- **Çalışan rolleri:** Odoo'nun kullanıcı/grup/yetki sistemi zaten mevcut — React panelde RBAC'ı sıfırdan yazmaya gerek yok.
- **Bağımlılık azalır:** React dashboard yok → bir uygulama az → bir deploy az.

**Eksileri:**
- Restoran sahibinin Odoo'nun biraz yoğun UX'ine alışması gerek (kullanım eğitimi artar).
- Mobil (telefon) panelinde Odoo UX zayıf — ama bu kullanım senaryosu PWA ile çakışıyor, manager için öncelik laptop/tablet.
- White-label sürekli bakım (ADR-0007).

### (B) Ayrı React dashboard, Odoo'ya API ile
**Artıları:**
- Pixel-perfect HashTap markası.
- İsteğe özel UX.

**Eksileri:**
- **Her feature Odoo + React'te iki kez yazılır.** Menü ekleme: Odoo form'u var, ayrıca React form'u yazmak gerek.
- Rapor/grafik sıfırdan.
- Deploy ve bakım yükü artar.
- MVP süresi uzar.
- Odoo'nun yetki sistemini API katmanına taşımak — custom RBAC kodu.

## Karar

**Odoo native + `hashtap_theme` ile white-label.**

## Gerekçe özeti

1. **Development velocity.** Odoo'nun "form/list/kanban/graph view"leri XML ile tanımlanıyor — bir sayfa yarım günde. React'te aynısı birkaç gün.
2. **Feature parite.** Muhasebe, stok, rapor — zaten Odoo UI'sında var. Ayrı React'te her birini yeniden yazmak 6+ ay ek iş.
3. **Yetki / roller.** Odoo'nun grup sistemini kopyalamak yerine kullan.
4. **White-label yaterli.** Son kullanıcı "bu HashTap'in yeni paneli" diyecek, Odoo değil. `WHITE_LABEL.md` bunu sağlıyor.

## Customer PWA ile neden farklı

Customer PWA:
- Halka açık, mobil-yoğun, saniyelik UX, bundle boyutu hayat-memat.
- Odoo'nun ağır frontend'i burada çökertici.

Restoran paneli:
- Laptop/tablet, çalışan kullanıcı, dakikalık UX.
- Odoo'nun UX'i bu ortamda iyidir (restoran sahibi muhtemelen zaten benzer iş yazılımı kullanıyordur — SambaPOS, Adisyo, muhasebe).
- Bundle boyutu önemli değil.

## Sonuçlar

- `apps/restaurant-dashboard/` Faz 0 iskelesi **silinir**. Bu kararla koda geçince repo temizliği yapılır.
- `hashtap_pos` Odoo modülü form/list/kanban view'larını sağlar.
- Panel Türkçeleştirmesi Odoo'nun `l10n-turkey` + kendi modül çevirilerimizle.
- İlerde "mobil manager uygulaması" ihtiyacı çıkarsa → ayrı bir React/React-Native uygulama düşünülür, ama panel değil; saha için özel.

## Review

- Pilot restoran sahibi paneli kullanmakta zorlanıyor mu? Eğitim 1 saatten fazla sürüyorsa UX sorun var.
- Günlük açılan panel oturum süresi ve tamamlanan aksiyon sayısı takip edilsin.
