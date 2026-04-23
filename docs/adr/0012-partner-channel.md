# ADR-0012 — B2B Partner (Reseller) kanalı

- Durum: kabul
- Tarih: 2026-04-23
- İlgili: `BUSINESS_MODEL.md`, `PARTNER_PROGRAM.md`, ADR-0011

## Bağlam

ADR-0011 ile SaaS cloud modelinden on-premise tek-kiracı modele
pivot yaptık. Doğrudan satış modeli (`BUSINESS_MODEL.md`) kuruldu:
HashTap satış + IT ekibi restorana gider, yazılımı kurar, teslim
eder, yıllık bakım satar.

Bu model iyi marjlı ama **lineer ölçeklenir**: 1000 restoran =
HashTap'in kendi kurduğu 1000 ekip-saha-günü. Küçük bir ekiple Türkiye
genelinde yaygınlaşmak için yetersiz.

Türkiye'nin her ilinde kurumsal müşteriye yazılım kuran yerel IT
şirketleri var. Bunların satış, kurulum, yerel güven ağları zaten
kurulu. HashTap bu firmaları bir **reseller kanalı** olarak kullanırsa:
- Saha ekibi sıfırdan kurulmamış olur
- Yerel güven + ilişki avantajı
- Paralel ölçek (1 ekibe 1 şehir değil, 20 partnere 20 şehir)

## Alternatifler

### Seçenek A — Sadece doğrudan satış (mevcut model)

**Artıları:**
- Marka/ürün kontrolü tamamen bizde
- Müşteri ilişkisi doğrudan
- Kar marjı en yüksek (aracı yok)

**Eksileri:**
- Lineer ölçek — Türkiye geneline yayılım çok yavaş
- Saha ekibi kurma/sürdürme yüksek maliyet
- Coğrafi dağılım sınırlı (uzak iller için ziyaret pahalı)
- Müşteri edinme maliyeti (CAC) yüksek

### Seçenek B — Sadece partner kanalı

Tüm satış ve kurulumu partner'lar yapar. HashTap sadece üretici.

**Artıları:**
- Tam scale — partner adedi kadar paralel satış
- Satış maliyeti bizden tamamen çıkıyor
- Operasyonel olarak "salt yazılım şirketi" olabilir

**Eksileri:**
- Kontrolümüz düşük — marka imajı partner'a bağlı
- İlk partner almak zor (referans yoksa, güven yok)
- Müşteri sorunu geldiğinde biz tek elden çözemiyoruz (partner aracı)
- Öğrenme kaybı — pazarla doğrudan temas yok, ürün körleşir

### Seçenek C — Hibrit: doğrudan + partner (önerilen)

1-2 büyük şehirde HashTap doğrudan satar (pilot + referans + öğrenme
noktası). Diğer illere partner ağı yürütür.

**Artıları:**
- Referans kurulumlar elimizde — partner satışı ikna kolay
- Pazar bilgisi sürekli bize akar (direkt müşteri + partner geri bildirim)
- Risk dağılımı — bir partner kaybedilirse kan kaybı yok
- İki kanal birbirini besler (partner daha büyük müşteri götürdüğünde
  HashTap teknik danışman)

**Eksileri:**
- İki kanalın yönetim yükü (ayrı süreçler, muhasebe)
- Pilot şehirlerde partner-HashTap çakışma riski (sözleşmede net olmalı)
- Kimlik karmaşası olabilir (restoran kafa karışıklığı)

### Seçenek D — Franchise (distribütör + sertifika + alan payı)

Partner'a daha büyük yetki: partner yerel marka adıyla satıyor (white-label),
HashTap sadece kaynak ürün. Royalty modeli.

**Artıları:**
- Partner motivasyonu en yüksek
- Marka yerelleşiyor

**Eksileri:**
- IP kontrolümüz çok düşük
- White-label ürünün kalite kontrolü zor
- Royalty denetimi zor (audit yüksek maliyet)
- Olgun bir ürün gerektiriyor; MVP aşamasında erken

## Karar

**Seçenek C — Hibrit (doğrudan + partner).**

İlk 12 ay doğrudan satış + 3-5 partner pilot. 12-24 ay partner
dominant model ama doğrudan satış İstanbul'da devam eder. White-label
(Seçenek D yönü) Gold tier partner'lara faz 2'de opsiyonel.

### Lisans modeli (kullanıcının kararı — 2026-04-23)

| Tier | Paket | Paket başı birim | Toplam |
|---|---|---|---|
| Tekil | 1 | 100.000 TL | 100.000 TL |
| Bronze | 10 | 80.000 TL | 800.000 TL |
| Silver | 30 | 65.000 TL | 1.950.000 TL |
| Gold (Enterprise) | 50+ peşin | 50.000 TL | 2.500.000 TL |

Fiyatlar **baz liste** — her partner sözleşmesinde tier + hacim +
bölge üzerinden müzakere edilir ("enterprise pricing").

Detay: `PARTNER_PROGRAM.md` §4.

### Uygulama kuralları

1. **İl-exclusive** (partner tier'ı büyüdükçe bölge genişler)
2. **Paralel doğrudan satış**: sadece 1-2 pilot şehir
3. **HashTap-branded** — white-label faz 2'de Gold tier opsiyonu
4. **Certified Partner programı** — sertifikasız satış yok
5. **Destek zinciri**: Partner L1, HashTap L2 (SLA'lı)
6. **Güncelleme**: HashTap direkt push (stable tag); Silver 7 gün
   delay opsiyonu, Gold 30 gün
7. **Partner Portal** zorunlu (lisans + kurulum + destek + fatura +
   pazarlama kit)
8. **Non-Exclusive Reseller Agreement** (il-exclusive annex ile)
9. **Minimum taahhüt**: Bronze tier + yıllık minimum kurulum hedefi
10. **Lisans renewal**: yıllık %20 bedel (her kurulum için)

## Sonuçlar

**Olumlu:**
- Türkiye geneli yaygınlaşma kapısı açılır
- Stabil lisans geliri (satış dalgalanması partner'a geçer)
- Marka bilinirliği yerel partner ağıyla hızla artar
- Doğrudan satış öğrenme laboratuvarı olarak kalır

**Olumsuz:**
- Operasyonel yük (sözleşme, eğitim, portal, denetim)
- Partner Success Manager rolü gerekli (zamanla)
- Marka kalite kontrol zorluğu (partner kötü kurulum yaparsa)
- Yasal altyapı (DPA zinciri, partner sözleşme templati)
- Üç taraflı destek akışında eskalasyon karmaşıklığı

**Risk yönetimi:** `PARTNER_PROGRAM.md` §15.

## Review kriterleri

- İlk partnerin pilot 3 kurulumu başarı oranı %100 mü?
- 12. ay sonunda 8-12 aktif partner var mı?
- L2 eskalasyon oranı <%25 mü (partner gerçekten L1'de çözüyor mu)?
- Partner NPS > 50 mi?
- Lisans renewal oranı > %90 mı?
