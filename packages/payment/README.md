# @hashtap/payment

Ödeme gateway adapter'ları. MVP: iyzico subMerchant.

## Facilitator modeli

Para **restoranın kendi subMerchant hesabına** gider. HashTap paraya hiç dokunmaz.

- Avantaj: MASAK/BDDK ödeme kuruluşu lisansı gerekmez, hukuki yük yok.
- Komisyon: gateway marketplace komisyonu (iyzico ~%1.7) + HashTap SaaS bedeli ayrı faturalanır.

## Mevcut gateway'ler

| Provider | Durum | Notlar |
|----------|-------|--------|
| `iyzico` | stub | subMerchant + 3DS |
| `paytr` | yok | planlı alternatif |
| `param` | yok | banka entegrasyonları geniş |
| `stripe` | yok | turistik bölgeler için yabancı kartlar |

## Bahşiş

`PaymentIntentInput.tipKurus` ayrı kalemde gateway'e gider. Restoranın isteğine göre ayrı bir alt hesaba (garson havuzu) yönlendirilebilir — gateway seviyesinde yapılandırılır.
