# @hashtap/efatura

e-Arşiv fiş entegratörleri — Türkiye ÖKC + e-Arşiv zorunluluğu için.

## Neden katman var?

Restoranların kullandığı entegratör farklı (Foriba, Uyumsoft, Logo eFatura, Mysoft). Karar: **mevcut entegratöre ayak uyduruyoruz** (hashcash.md §13.3). Yeni entegratör eklemek adapter eklemek demek.

## Akış

1. Ödeme onayı → `issueReceipt` çağrılır.
2. Entegratör GİB'e bildirir, PDF döner.
3. PDF + UUID sipariş kaydına yazılır, müşterinin e-postasına gönderilir.
4. Başarısızlıkta sipariş `paid` durumunda kalır, restorana panel uyarısı çıkar — **mutfağa gitmez**, çünkü fişsiz servis vergi riski.

## Mevcut sağlayıcılar

| Sağlayıcı | Durum |
|-----------|-------|
| `foriba` | stub |
| `uyumsoft` | yok |
| `logo` | yok |
| `mysoft` | yok |
