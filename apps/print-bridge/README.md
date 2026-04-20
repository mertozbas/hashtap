# @hashtap/print-bridge

POS'u olmayan (veya entegrasyon için hazır olmayan) işletmelerde mutfak yazıcısını besleyen küçük Node ajanı.

## Ne yapar

HashTap API'ye WebSocket ile bağlanır; `order.paid` event'i gelince sipariş fişini ESC/POS ile yazıcıya basar ve `order.printed` onayı gönderir.

## Donanım

- Raspberry Pi 4 / Zero 2 W
- Ethernet veya Wi-Fi (lokal ağ, yazıcıya erişebilmeli)
- Epson TM-T20/T82 (veya ESC/POS uyumlu) termal yazıcı

## Env değişkenleri

```
HASHTAP_API_WS=wss://api.hashtap.co/v1/print-bridge
PRINT_BRIDGE_TOKEN=<tenant token>
PRINTER_INTERFACE=tcp://192.168.1.100:9100
```

## Çalıştırma

```sh
npm install
npm run build
HASHTAP_API_WS=... PRINT_BRIDGE_TOKEN=... PRINTER_INTERFACE=... node dist/index.js
```

Prodüksiyonda `systemd` servisi olarak açılması önerilir.

## Durum

İskele. Yeniden bağlanma, offline kuyruk, sağlık metrikleri daha sonra eklenecek.
