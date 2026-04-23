# HashTap — Runbook'lar

Bu klasör, sık karşılaşılan operasyonel durumlar için adım-adım müdahale
kılavuzlarını içerir. Her runbook'un başında belirli bir olay sınıfı
hedeflenir (P0/P1/P2/P3).

## İndeks

| Dosya | Seviye | Tanım |
|---|---|---|
| [`postmortem-template.md`](./postmortem-template.md) | — | P0/P1 sonrası zorunlu postmortem şablonu |
| [`p0-cash-pc-unbootable.md`](./p0-cash-pc-unbootable.md) | P0 | Kasa PC'si açılmıyor |
| [`p0-postgres-corrupt.md`](./p0-postgres-corrupt.md) | P0 | Postgres bozulmuş / başlamıyor |
| [`p1-payment-gateway-down.md`](./p1-payment-gateway-down.md) | P1 | iyzico ödeme gateway'i yanıt vermiyor |
| [`p1-printer-queue-stuck.md`](./p1-printer-queue-stuck.md) | P1 | Print-bridge kuyruğu takıldı |
| [`p2-kds-slow.md`](./p2-kds-slow.md) | P2 | KDS yavaş yükleniyor / gecikme var |
| [`p2-backup-failure.md`](./p2-backup-failure.md) | P2 | Gecelik backup başarısız |
| [`periyodic-restore-test.md`](./periyodic-restore-test.md) | — | 3 aylık rutin restore testi |

Sınıflandırma ve SLA detayı: [`../OPERATIONS.md` §6.1](../OPERATIONS.md).

## Runbook yazım kuralları

Her runbook şu bölümleri içermelidir:
1. **Özet** — tek cümle tanım
2. **Tespit işaretleri** — dashboard, log, kullanıcı şikayeti nasıl belirir
3. **Önkoşullar** — Tailscale bağlantısı, yetki vs.
4. **Adımlar** — komutlarla, idempotent
5. **Eskalasyon kriterleri** — ne zaman başkasını çağırmalı
6. **Doğrulama** — çözüm onay adımları
7. **İlgili olay kayıtları** — bilinen tekrar eden örnekler
