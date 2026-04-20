# ADR-0006 — DB-per-tenant izolasyon modeli

- Durum: kabul
- Tarih: 2026-04-20
- İlgili: ADR-0004, `MULTI_TENANCY.md`, `SECURITY.md`

## Bağlam

HashTap çok kiracılı bir SaaS. Kiracı-arası veri izolasyonu güvenlik ve KVKK açısından birinci dereceden önemli.

Odoo üstünde çalıştığımız için seçenekler daha dar:
1. **Tek DB + `tenant_id` sütunu** (row-level).
2. **Schema-per-tenant** (Postgres schema).
3. **DB-per-tenant** (her kiracı için ayrı Postgres DB).

## Alternatifler

### Tek DB + tenant_id

**Artıları:**
- Tek yedek, tek upgrade.
- Global raporlama kolay.
- Operasyonel basitlik.

**Eksileri:**
- **Odoo native desteklemiyor.** Her model/tabloya tenant_id eklemek core değişikliği gerektirir. ADR-0005 ile (core'a dokunma) çelişir.
- **Leak riski:** Bir ORM query'de `tenant_id` filter unutulursa başka kiracının verisi gelir. Odoo record rules bunu biraz azaltır ama mükemmel değil.
- **KVKK veri silme:** "Bu kiracının verisini sil" = 100+ tablodan DELETE. Yanlış yapmak kolay.

### Schema-per-tenant

**Artıları:**
- Orta yol: ayrık şemada veri, tek cluster.
- Backup daha granüler.

**Eksileri:**
- **Odoo schema desteği yok.** Her Odoo instance bir DB'ye bağlanır; schema switching native değil. Yine core değişikliği.
- Operasyonel karmaşa orta.

### DB-per-tenant

**Artıları:**
- **Odoo native destekliyor** (multi-database). Odoo Online bu modelde çalışıyor — binlerce kiracıyla kanıtlı.
- **En güçlü izolasyon:** SQL kaçağı bile başka kiracıya ulaşamaz.
- **KVKK veri silme:** `DROP DATABASE` — basit ve denetlenebilir.
- **Backup / restore:** Kiracı-başı, granüler.
- **Performans izolasyonu:** Bir kiracının ağır sorgusu başka kiracıyı etkilemez (biraz — shared Postgres'te tamamen değil, shared worker pool'da yok).

**Eksileri:**
- **Operasyonel yük:** 100 kiracı = 100 DB. Migration'lar N kez çalışır.
- **Global raporlama zor:** HashTap ekibinin "tüm kiracılar için toplam ciro" sorusu ayrı analytics pipeline gerektirir.
- **Resource overhead:** Her DB'nin kendi connection pool, index cache'i.

## Karar

**DB-per-tenant.**

Kritik gerekçe: Odoo bu modeli birincil sınıf destekliyor; diğer modellerin her biri core'a dokunmayı gerektiriyor, ADR-0005 ile çelişiyor.

İkincil gerekçeler: KVKK uyumu, veri izolasyonu, yedek granülasyonu.

Dezavantajları (operasyonel yük, global raporlama) MVP ölçeğinde (10-50 kiracı) taşınabilir. Ölçek büyüyünce (`MULTI_TENANCY.md` §8) shard'lama ve kiracı tiyerlemeye geçilir.

## Uygulama kuralları

1. Her kiracı → ayrı Postgres DB (`tenant_<slug>`).
2. Odoo `db_filter` ayarı subdomain'e göre DB seçer: `tenant\.hashtap\.co → tenant_\1`.
3. Gateway'in kendi küçük registry DB'si var — kiracı izolasyonuna **tabi değil** (sadece HashTap ekibi erişir).
4. HashTap ekibinden hiçbir kod başka kiracı DB'sine cross-query atmaz. Global raporlama için ayrı data warehouse pipeline yazılır (MVP dışı).
5. Provisioning / offboard otomasyonu (`MULTI_TENANCY.md` §3) idempotent olur.

## Global raporlama yolu (ileride)

- Gecelik: her kiracı DB'sinden ilgili tabloların özet extract'i (CDC veya batch).
- Hedef: ayrı bir Postgres / ClickHouse warehouse.
- Warehouse tenant_id sütunuyla tek şemalı — analiz kolay.
- MVP'de yok; 50+ kiracıda gerekir.

## Upgrade stratejisi

- DB schema migration: her kiracı için `odoo -d <db> -u hashtap_pos --stop-after-init`.
- Bakım pencereleri: Türkiye saati gecesi, restoran kapalıyken.
- Rolling: max 10 kiracı/gece, hata oranı %5'i aşarsa dur.
- Detay: `MULTI_TENANCY.md` §7.

## Sonuçlar

- Kiracı-arası veri sızıntısı tehdidi minimize.
- Operasyonel otomasyon şart: manuel DB yönetimi 10+ kiracıda yaşanabilir değil.
- Global analiz için ayrı DWH pipeline roadmap'te.

## Review kriterleri

- 50 kiracıya çıkarken upgrade süresi ne kadar?
- Tek kiracı için DR restore süresi (RTO) < 4 saat?
- Provisioning hata oranı < %1?
