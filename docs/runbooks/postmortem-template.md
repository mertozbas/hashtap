# Postmortem — {{ olay başlığı }}

P0/P1 olaylarında 72 saat içinde doldurulur. Blame-free; hedef sistemik
iyileştirme.

- **Olay ID:** INC-YYYY-NNNN
- **Seviye:** P0 / P1
- **Restoran:** `<slug>` (installation_id: `<id>`)
- **Başlangıç (TR):** YYYY-MM-DD HH:MM
- **Bitiş (TR):** YYYY-MM-DD HH:MM
- **Süre:** X saat Y dakika
- **Etkilenen sipariş sayısı:** N
- **Ciro etkisi (tahmini):** X TL
- **Hazırlayan:** {{ isim }}
- **Son güncelleme:** YYYY-MM-DD

## 1. Özet

3-4 cümle. Ne oldu? Kim etkilendi? Nasıl çözüldü?

## 2. Zaman çizelgesi

| Saat (TR) | Olay |
|---|---|
| HH:MM | Monitoring uyarısı düştü (örn. heartbeat > 10 dk) |
| HH:MM | On-call onayladı, Tailscale ile bağlandı |
| HH:MM | Kök neden tespit edildi: ... |
| HH:MM | Geçici fix uygulandı |
| HH:MM | Müşteri WhatsApp ile bilgilendirildi |
| HH:MM | Doğrulandı, olay kapandı |

## 3. Kök neden

Beş neden (5 whys) analizi:

1. Neden X oldu? → ...
2. Neden Y oldu? → ...
3. Neden Z oldu? → ...

**Asıl kök neden:** ...

## 4. Etki

- **İşletme tarafı:** kaç sipariş kaçtı, kaç TL ciro kaybı, müşteri
  şikayeti gelip gelmediği
- **Operasyonel:** kaç kişi saati gerektirdi, on-call rotasyonu
  etkilendi mi
- **Teknik:** hangi servis, hangi sürüm, başka kurulumlara sıçrama
  riski var mıydı

## 5. Neyi iyi yaptık

- ...
- ...

## 6. Neyi kötü yaptık

- ...
- ...

## 7. Aksiyon öğeleri

Her aksiyon için sahip + tarih + issue link.

| # | Aksiyon | Sahip | Tarih | Durum |
|---|---|---|---|---|
| 1 | Monitoring kuralı ekle: ... | | | açık |
| 2 | Runbook güncelle: `docs/runbooks/...` | | | açık |
| 3 | Kod düzeltmesi: ... | | | açık |
| 4 | Partner eğitim notu: ... | | | açık |

## 8. İlgili dokümanlar

- Runbook: `docs/runbooks/...`
- İlgili commit / PR: ...
- Slack thread: ...
