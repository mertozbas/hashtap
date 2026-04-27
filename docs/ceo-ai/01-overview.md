# 01 — CEO AI Asistanı: Genel bakış

Son güncelleme: 2026-04-27.

## 1. CEO nedir?

**CEO**, bir HashTap restoranının patronuna eşlik eden kişisel AI
asistanıdır. Patron telefondan veya bilgisayardan yazar; CEO
restoranın **o anki tüm verisine** erişir, sayılarla cevap verir,
gerekirse rapor üretir.

Tasarım metaforu: bir profesyonel CEO'nun kafasında olan tablo —
ciro, açık siparişler, stok, en çok satan, ödeme dağılımı, kasa
durumu — bu ajanda canlı yaşar. Patron sorduğunda zaten **bilir**.

## 2. Niye AI ajan, neden Strands?

| İhtiyaç | Çözüm |
|---|---|
| Patron her sorduğunda Odoo dashboard'una girmek istemez | Doğal dil sohbet |
| Birçok rapor için ayrı menü gezinmesi gerek | Tek arayüz, çok kaynak |
| Telegram'dan da erişim olsun | Aynı ajan, çoklu kanal |
| Veri güvenliği — bulut LLM şirket verisini görmesin | Ollama (lokal) varsayılan |
| Provider esnekliği (rakipsiz olduğunda Claude'a geç) | Strands provider switch |
| Gelecekte personel + müşteri ajanları | Aynı framework genişletir |

Strands AWS'in 2025'te açtığı framework — provider-agnostic, tool-call
native, memory built-in, FastAPI ile native uyumlu.

## 3. Kim kullanır? (Faz planı)

| Faz | Kullanıcı | Kapsam |
|---|---|---|
| **1 (şimdi)** | Sadece patron | Okuma — ciro, sipariş, stok, rapor |
| 2 | Patron | + yazma — sipariş kapat, kampanya başlat |
| 3 | Eleman (kasiyer, garson) | Operasyonel — "X masa hazır mı?", "Y stoğu kontrol et" |
| 4 | Müşteri (PWA içi) | Tatlı önerisi, alerji bilgisi, garson çağrı |
| 5 | Çoklu restoran sahibi | "Üç şubemin bugünkü cirosu?" |

Her faz kendi yetki sınırlarıyla aynı ajan üzerinden çalışır. Faz 1'de
yalnızca admin user'lar (Odoo `base.group_system`) ajanla konuşabilir.

## 4. Tipik diyaloglar

### 4.1 Günlük operasyon

```
Patron:  Bugün ne yapıyoruz?
CEO:     📈 Bugün 25 sipariş, 278.060 ₺ ciro. Şu an 4 masa açık,
         3 sipariş mutfakta, 1 hazır. Dünden %12 fazla.
         En çok satan: Kuzu Sırt (4 adet, 7.527 ₺).

Patron:  A4 masasında ne var?
CEO:     Masa A4 — 18:42'de açıldı, 1 sipariş açık (ORD-2026-000201).
         3 kalem: 2× Izgara Levrek + 1× Kuzu Sırt + 1× Çağla Salata.
         Toplam 5.327 ₺. Henüz ödenmedi.

Patron:  Stoğu kritik olan ürünleri göster
CEO:     ⚠ 3 ürün eşik altında:
         • Dom Pérignon (Şişe) → 2 (eşik 5)
         • Kuzu Sırt → 8 (eşik 10)
         • Tekirdağ Altın 70cl → 5 (eşik 10)
         Önerim: bugün yenileyin, akşam yoğunluğa hazır olun.
```

### 4.2 Rapor isteği

```
Patron:  Bana dünkü Z raporunu ver.
CEO:     [Markdown tablo]

         # Z Raporu — 2026-04-26
         | Metrik | Değer |
         |---|---|
         | Sipariş | 55 |
         | Brüt | 642.798,06 ₺ |
         | Tahsil | 642.798,06 ₺ |
         | Nakit | 193.654,40 ₺ |
         | Kart | 152.647,30 ₺ |
         | ... | ... |

         Sayım uyumluydu, fark 0 ₺. Detayı isterseniz HTML'i de
         hazırlayabilirim.

Patron:  Evet HTML olarak gönder
CEO:     [report-2026-04-26.html dosyası — Discuss attachment]
         Z raporu hazır. Yazıcıdan basabilir veya muhasebeye
         iletebilirsiniz.
```

### 4.3 Strateji + öneri

```
Patron:  Bu hafta nasıl gidiyoruz?
CEO:     Bu hafta (Pzt-Cum) toplam 235 sipariş, 2.4M ₺ ciro.
         Geçen haftaya göre %18 artış (özellikle Cum + Cmt). Dom
         Pérignon satışları 3 kat arttı — kutlama trafiği güçlü.
         
         💡 Önerim: Cuma akşam Pasaeli Yaşlı Asma şarabı 8 adet
         kaldı, hafta sonu 4-5 satış bekliyorum. Tedarikçiye sipariş
         vermek ister misiniz?

Patron:  Peak saatlerimiz ne?
CEO:     Son 7 günde:
         • Öğle: 13:15-14:00 (ortalama 6 sipariş/15dk)
         • Akşam: 20:30-22:00 (ortalama 9 sipariş/15dk)
         Cmt akşam %40 daha yoğun. Mutfak vardiyasını buna göre
         planlayabilirsiniz.
```

## 5. Sınırlar — CEO ne yapMAZ (Faz 1)

- ❌ **Yazma** — sipariş silmez, fiyat değiştirmez, ödeme almaz
- ❌ **Personel verisi** — maaş, vardiya (HR modülü kurulu değil)
- ❌ **Tedarikçiye sipariş** — purchase modülü yok (henüz)
- ❌ **Tahmin / proje çalışması** — sadece geçmiş + şimdi
- ❌ **Müşteri kişisel verisine bakma** — (KVKK)
- ❌ **Kâr/zarar net hesabı** — gider tarafı eksik (giderler manuel)

Hepsi sonraki fazların hedefi (bkz. [`09-roadmap.md`](./09-roadmap.md)).

## 6. Güvenlik temel ilkeleri

1. **Lokal varsayılan**: Ollama host'ta koşar, restoran verisi
   şirket dışına çıkmaz. Bulut LLM (Claude/GPT) opsiyonel —
   açıkça aktif edilmediği sürece offline çalışır.
2. **Salt okuma (Faz 1)**: Generic `use_hashtap` tool'u sadece
   `search`, `search_read`, `read`, `name_get` metodlarına izin
   verir. `write/create/unlink` Faz 2'de izin grupları ile açılır.
3. **Yetki**: ajan ile konuşabilen user `base.group_system`
   grubunda olmalı. Diğer kullanıcılar mesaj atsa bile cevap
   alamaz.
4. **PII redaksiyon**: müşteri telefon, e-posta, kart son 4 hane
   gibi alanlar tool çıktılarında maskelenir.
5. **Rate limit**: kullanıcı başı 10 req/dakika; üstü kuyruğa
   alınır.
6. **Audit log**: her tool çağrısı `ai_bot_calls.jsonl`'e yazılır
   (kim, ne zaman, hangi tool, args özet).

## 7. Maliyet

| Senaryo | Aylık tahmini |
|---|---|
| Ollama lokal (gemma4:31b) | **0 ₺** (sadece elektrik / RAM) |
| Anthropic Claude Sonnet 4.6 | $3-8 (orta yoğun patron, ~50 mesaj/gün) |
| OpenAI GPT-4o-mini | $0.50-2 |
| AWS Bedrock Claude | $3-8 (Anthropic ile aynı) |

Restoran tarafında ekstra altyapı maliyeti yok (zaten Cashier PC'si
8GB RAM yeterli; Ollama gemma4:31b için 32GB+ RAM gerek →
**bu kurulum şimdilik HashTap merkezi geliştirme makinesinde
kalır**, restorana bulut LLM ile gider).

## 8. Sonraki adım

Detaylar:
- [`02-architecture.md`](./02-architecture.md) — bileşenler nasıl bağlanıyor
- [`03-tools-catalog.md`](./03-tools-catalog.md) — 9 tool'un detayı
- [`07-prompting.md`](./07-prompting.md) — CEO sistem prompt'u
