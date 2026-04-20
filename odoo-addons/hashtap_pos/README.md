# hashtap_pos

HashTap'in iş mantığı modülü. Odoo 17 + `pos_restaurant` üzerine oturur.

Tasarım detayı: [../../docs/MODULE_DESIGN.md](../../docs/MODULE_DESIGN.md).
Veri modeli: [../../docs/DATA_MODEL.md](../../docs/DATA_MODEL.md).

## İskelet durumu

Bu iskelet sadece modülün kurulabilmesi için gerekli minimum dosyaları içeriyor:

- `__manifest__.py` — bağımlılıklar ve data listesi
- `controllers/main.py` — `/hashtap/health` endpoint'i
- `views/menu_root.xml` — üst menü "HashTap" ve 3 alt giriş
- `security/ir.model.access.csv` — boş (model eklenince doldurulur)

İleride eklenecekler (ROADMAP Faz 2 ve sonrası):

- `models/menu.py` — `hashtap.menu.category`, `hashtap.menu.item`, `hashtap.modifier.group`, `hashtap.modifier`
- `models/table.py` — `restaurant.table` extension
- `models/order.py` — `pos.order` extension (`hashtap_state`, `hashtap_correlation_id`...)
- `services/iyzico_client.py`, `services/earsiv_client.py`
- `security/hashtap_security.xml` — grup tanımları
- `data/ir_cron.xml` — periyodik işler
- Test paketi

## Bağımlılık notu

`queue_job` (OCA) async iş için kullanılacak ama iskelet aşamasında henüz
devrede değil. Repo'ya eklendikten sonra `depends` listesine geri alınır.
