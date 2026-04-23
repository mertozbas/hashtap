# P0 — Kasa PC'si açılmıyor

**Seviye:** P0
**SLA:** 15 dk ilk müdahale, 4 saat içinde tam restore (RTO).

## Özet

Restoranın kasa PC'si donanım arızası, disk ölümü, boot hatası
nedeniyle açılmıyor. Restoran tamamen iş göremez durumda.

## Tespit işaretleri

- Monitoring: heartbeat 10+ dakikadır yok (PagerDuty tetiklendi).
- Restoran: WhatsApp/telefon ile "kasa açılmıyor" şikâyeti.
- Tailscale dashboard: cihaz offline.

## Önkoşullar

- Donanım yedeği (yeni mini-PC veya kullanılmayan backup cihaz).
- Partner veya HashTap IT saha ziyarete gidebiliyor.
- restic + B2 credentials erişimi (dual-custody — anahtar kasada +
  HashTap KMS).

## Adımlar

### 1. Restoran ile iletişim
- WhatsApp'tan "ilgileniyoruz, tahmini çözüm süresi 2-4 saat" mesajı.
- Müşteri yanında ek cihaz var mı sor (yedek tablet, telefon: en azından
  müşteri PWA ile sipariş alınabilir kısa süreli mod).

### 2. Hızlı teşhis (uzaktan deneme)
```bash
# Tailscale status
tailscale status | grep "<slug>"
# Down ise restorana telefon açık — AnyDesk fallback dene
```

- Eğer Tailscale + AnyDesk ikisi de yok → saha ziyareti kaçınılmaz.

### 3. Saha ziyareti
- Kasa PC'sini aç, boot mesajlarına bak.
- BIOS'a gir → disk tanınıyor mu kontrol et.
- SMART test (mümkünse canlı Ubuntu USB ile `smartctl -a /dev/sda`).

**Durum A — Disk kaybı (ölü SSD):**
- Yedek PC'yi kur veya yeni disk tak.
- Ubuntu LTS yükle (22.04/24.04).

**Durum B — Boot loader bozuk, disk sağlam:**
- Canlı USB'den boot, `grub-install` / `update-grub`.
- Boot'tan sonra docker stack'i başlat, adım 5'e geç.

### 4. Restore (Durum A)

```bash
# Yeni cihazda installer'ı indir
curl -sSL https://install.hashtap.app | bash --restore <slug>

# Installer prompt'larında:
#   - Installation ID: <id>
#   - Slug: <slug>
#   - Restic repo + password (HashTap KMS'ten al)
```

Installer adımları (beklenen):
1. Docker + compose kurar
2. `hashtap-restore latest` çalıştırır (pg_restore + filestore)
3. `.env` geri yüklenir
4. Tailscale cihazı yeni node olarak kaydolur
5. Docker compose up, servisler yeşil
6. Heartbeat ops'a atılır, dashboard'da görünür

### 5. Doğrulama

```bash
# Servisler ayakta mı?
docker compose ps

# Son sipariş kayıtta mı?
docker compose exec postgres psql -U hashtap -c \
  "SELECT id, state, date_order FROM pos_order ORDER BY date_order DESC LIMIT 5;"
```

- Restoran personeliyle birlikte:
  - Kasa açılıyor mu?
  - Menü güncel mi?
  - QR menü siparişi çalışıyor mu?
  - Yazıcı, KDS, garson tableti bağlanıyor mu?

### 6. Eski cihaz temizliği

- Ölü disk: KVKK uyumlu imha (fiziksel yok etme veya wipe).
- Tailscale: eski node'u sil (`tailscale nodes delete ...`).
- Ops dashboard: kurulum yeni cihazla eşleştir.

## Eskalasyon kriterleri

- 1 saat içinde çözüm yolu belirlenemediyse → ikinci on-call.
- 3 saat geçti RTO tehlikede → kurucu + kritik iletişim.
- Restore başarısız olduysa (şifre yanlış / snapshot bozuk) → SEV-1
  alert + B2 destek.

## Doğrulama

- [ ] Heartbeat ops dashboard'da yeşil
- [ ] Son 3 sipariş görülebiliyor
- [ ] Kart ödeme test işlemi başarılı
- [ ] QR menü + yazıcı + KDS test edildi
- [ ] Müşteri "olay kapandı" onayı verdi
- [ ] Postmortem açıldı (INC-YYYY-NNNN)

## Önleyici aksiyonlar (tekrar etmemesi için)

- SMART + disk sağlığı heartbeat'e ek metrik olarak
- Yüksek hacimli restoranlarda RAID veya SSD yedekleme
- Donanım garantisi aktif mi kontrol et (24 ay)
