# P2 — KDS yavaş yükleniyor / gecikme var

**Seviye:** P2
**SLA:** Aynı gün müdahale.

## Özet

Mutfak Display System (KDS) ekranında siparişler geç görünüyor,
`bus.bus` polling gecikmeli, veya ekran lag yapıyor.

## Tespit işaretleri

- Mutfak personeli: "siparişler bazen 2-3 dk sonra geliyor".
- Gateway log'unda `bus.bus` polling latency > 5s.
- Odoo log'unda longpolling worker tükenmesi.

## Adımlar

### 1. Teşhis

```bash
ssh hashtap-ops@restaurant-<slug>
cd /opt/hashtap
docker compose logs odoo --tail=500 | grep -iE "bus|long"
docker compose exec odoo top -bn1 | head -20
```

**CPU yüksek:** Odoo longpolling worker'ı yetmiyor. `odoo.conf` içinde
`longpolling_port` + `workers` artır, restart.

**Network latency:** KDS ekranı Wi-Fi üzerinden uzakta. Ethernet'e geçir.

**DB lock:** `pg_stat_activity` uzun süreli query var mı?

```bash
docker compose exec postgres psql -U hashtap -c \
  "SELECT pid, now() - query_start AS dur, query \
   FROM pg_stat_activity \
   WHERE state != 'idle' ORDER BY dur DESC LIMIT 10;"
```

### 2. Hafif fix

```bash
# Odoo'yu restart (longpolling reset)
docker compose restart odoo

# KDS tablet browser cache temizle (restoran tarafında)
```

### 3. Çoklu istasyon optimizasyonu

Restoran büyükse (80+ masa) soğuk/sıcak mutfak ayrı KDS'e böl. Faz 13
kapsamı.

## Eskalasyon kriterleri

- Lag 2 saatten fazla süreklilik arz ediyorsa → kapasite analizi
  (`docs/OPERATIONS.md` §8.1).
- Odoo workers sürekli yetmiyorsa → donanım upgrade gerekebilir.

## Doğrulama

- [ ] Yeni sipariş 2 saniye içinde KDS'e düşüyor
- [ ] CPU < %70 peak
- [ ] Mutfak "hızlandı" onayı verdi
