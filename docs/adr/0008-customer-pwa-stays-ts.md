# ADR-0008 — Customer PWA TS/React'te kalır

- Durum: kabul
- Tarih: 2026-04-20
- İlgili: ADR-0004, ADR-0009

## Bağlam

Odoo'yu taban aldığımızda "tüm frontend Odoo'ya taşınsın mı" sorusu doğal olarak çıkıyor. Odoo'nun kendi frontend framework'ü (OWL) vardır, kendi Website modülü vardır; teorik olarak müşteri PWA'sını Odoo içinde yazmak mümkün.

Bu ADR, müşteri PWA'sını neden Odoo'ya taşımadığımızı belgeler.

## Alternatifler

### (A) Müşteri PWA Odoo Website modülünde
**Artıları:**
- Tek kod tabanı.
- Odoo ile tight integration.

**Eksileri:**
- **Odoo'nun frontend'i ağır.** OWL + Odoo JS bundle'ı 500KB+ sıkıştırılmış. Mobilde QR → menü açılışı saniyelerce sürebilir, turist-yoğun ortamda rezalet.
- **PWA özellikleri:** Service worker, offline cart, install prompt, push notif — Odoo Website'da mümkün ama tuhaf. React'te birinci sınıf.
- **Mobil UX:** Odoo native mobil kalitesinde değil. QR akışında her milisaniye önemli.
- **Bağımsız deploy:** Odoo modül güncellemesi Odoo restart gerektirir; PWA kendi başına güncellenir → müşteri akışı etkilenmez.
- **Cache:** Statik PWA asset'leri CDN'den dağıtmak kolay; Odoo dinamik.

### (B) Müşteri PWA TS/React'te kalır, gateway üzerinden Odoo API'ye konuşur
**Artıları:**
- Yukarıdaki tüm dezavantajların tersi: hafif bundle, birinci sınıf PWA, mobil-optimize UX, bağımsız deploy, CDN.
- Mevcut kod (faz 0'da yazılan `apps/customer-pwa`) korunur; boşa harcanan iş yok.
- Frontend ekibi Odoo öğrenmeden PWA'yı geliştirebilir.

**Eksileri:**
- Stack split: backend Python, frontend TS. İki dünya.
- API katmanı bakmamız gerekiyor (gateway var).

## Karar

**Customer PWA TS/React'te kalır.** Gateway üzerinden Odoo'ya konuşur.

## Gerekçe özeti

1. Mobil UX kritik. QR akışı birkaç saniyelik; Odoo'nun bundle'ı bu akışı sabote eder.
2. PWA özellikleri (offline cart, service worker) React + vite-plugin-pwa ekosisteminde olgun, Odoo'da egzotik.
3. Bağımsız deploy ve cache süreleri operasyonel olarak temiz.
4. Mevcut faz 0 kodu yeniden kullanılabilir.

## Sonuçlar

- Stack split kabul edilir: Python (Odoo + modül) + TS (gateway + PWA).
- İşe alımda her iki yetkinlik aranır, veya biri öğrenir.
- Gateway bu ADR'in sonucu olarak zorunlu bir katman (PWA doğrudan Odoo'ya konuşamaz: security, rate limit, API massage).
- Restoran paneli aynı logic'le Odoo'ya taşınmıyor çünkü orada durum farklı (ADR-0009'da ayrı anlatılır).

## Review

- PWA bundle boyutu < 150KB sıkıştırılmış hedef.
- QR → ilk menü ekranı TTI (Time To Interactive) < 2s 4G'de.
- Kırmızıya düşerse PWA optimizasyonu, Odoo'ya geçiş değil.
