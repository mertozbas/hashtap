"""HashTap 3+ günlük operasyon simülasyonu — Zeytin & Tuz

Son 3 tam gün + bugün (sabah/öğle) için gerçekçi restoran trafiği üretir:
  - Öğle (12-14) ve akşam (19-22) peak'li sipariş dağılımı
  - Farklı masalar, farklı ödeme yöntemleri
  - Sipariş yaşam döngüsü tam: placed → paid → kitchen_sent → preparing
    → ready → served
  - Her ödenmiş sipariş için account.move (müşteri faturası) oluşturur
  - Her satılan ürün için stok düşümü (stock.move + stock.quant)

Çalıştırma:
    docker exec -i odoo-odoo-1 odoo shell -d hashtap --no-http \
        < odoo-addons/hashtap_pos/data/simulate_days.py

Idempotent: `simulated=True` etiketli siparişleri silip yeniden oluşturur.
"""
import logging
import random
from datetime import datetime, timedelta, timezone

from odoo import fields

_logger = logging.getLogger("hashtap.simulate")

PAYMENT_MIX = [
    ("card", 0.40),
    ("apple_pay", 0.12),
    ("google_pay", 0.10),
    ("cash", 0.25),
    ("pay_at_counter", 0.13),
]


def weighted_pick(pairs):
    r = random.random()
    acc = 0.0
    for value, weight in pairs:
        acc += weight
        if r < acc:
            return value
    return pairs[-1][0]


def pick_items(categories, count):
    """Gerçekçi menü seçimi: kategorilerden karma al."""
    pool = []
    for cat_name, items in categories.items():
        pool.extend([(cat_name, item) for item in items])
    # Starters daha sık, ana yemek bazen, bar arada
    picks = []
    for _ in range(count):
        cat_name, item = random.choice(pool)
        picks.append(item)
    return picks


def simulated_hour_distribution():
    """Öğle + akşam peak'li saat:dakika dağılımı."""
    ranges = [
        # (start_h, end_h, weight)
        (12, 14, 0.35),  # öğle
        (19, 22, 0.45),  # akşam
        (11, 12, 0.05),
        (14, 17, 0.05),
        (17, 19, 0.05),
        (22, 24, 0.05),
    ]
    slot = weighted_pick([(r, r[2]) for r in ranges])
    start_h, end_h, _ = slot
    hour = random.randint(start_h, end_h - 1)
    minute = random.randint(0, 59)
    return hour, minute


def ensure_accounts(env, company):
    """Satış hesabı + kasa hesabı + sales journal eksiksiz olsun."""
    Account = env["account.account"]
    Journal = env["account.journal"]

    # Satış geliri — yurtiçi
    income = Account.search(
        [("code", "=", "600000"), ("company_id", "=", company.id)], limit=1,
    )
    if not income:
        income = Account.search([("account_type", "=", "income")], limit=1)

    # Kasa
    cash = Account.search(
        [("account_type", "=", "asset_cash"), ("company_id", "=", company.id)],
        limit=1,
    )

    journal = Journal.search(
        [("type", "=", "sale"), ("company_id", "=", company.id)], limit=1,
    )
    if not journal:
        journal = Journal.create({
            "name": "Zeytin & Tuz Satış",
            "code": "STUZ",
            "type": "sale",
            "company_id": company.id,
        })
    if income and not journal.default_account_id:
        journal.default_account_id = income.id

    return journal, income


def set_product_income_accounts(env, income):
    """Tüm hashtap ürünlerinin gelir hesabını set et."""
    tmpls = env["hashtap.menu.item"].sudo().search([]).mapped("product_tmpl_id")
    for tmpl in tmpls:
        if not tmpl.property_account_income_id:
            tmpl.property_account_income_id = income.id


def find_or_create_walkin(env, company):
    """'Walk-in' — tezgâh müşterisi temsili partner."""
    Partner = env["res.partner"]
    p = Partner.search(
        [("name", "=", "QR Walk-in"), ("company_id", "in", [False, company.id])],
        limit=1,
    )
    if p:
        return p
    return Partner.create({
        "name": "QR Walk-in",
        "company_id": company.id,
        "customer_rank": 1,
    })


def create_invoice(env, order, partner, journal, income_account):
    """Ödenmiş sipariş için posted durumda account.move üret."""
    Move = env["account.move"]
    lines = []
    for line in order.line_ids:
        product = line.item_id.product_tmpl_id.product_variant_id
        income = (
            line.item_id.product_tmpl_id.property_account_income_id
            or income_account
        )
        lines.append((0, 0, {
            "product_id": product.id,
            "name": line.item_name,
            "quantity": line.quantity,
            "price_unit": (line.unit_price_kurus + line.modifier_total_kurus) / 100.0,
            "account_id": income.id,
        }))
    move = Move.create({
        "move_type": "out_invoice",
        "partner_id": partner.id,
        "invoice_date": order.create_date.date(),
        "journal_id": journal.id,
        "invoice_origin": order.name,
        "invoice_line_ids": lines,
    })
    try:
        move.action_post()
    except Exception as e:  # noqa: BLE001
        _logger.warning("invoice post failed for %s: %s", order.name, e)
    return move


def write_stock_out(env, order, stock_loc):
    """Her satır için stock.quant ile doğrudan stok düşümü.

    stock.move/picking workflow karmaşık olduğu için MVP demo'da quant
    tablosunu direkt güncelliyoruz. Gerçek ortamda pos.order köprüsü
    stock.move üretir — Faz 4+ işi.
    """
    Quant = env["stock.quant"]
    total = 0
    for line in order.line_ids:
        product = line.item_id.product_tmpl_id.product_variant_id
        if not product:
            continue
        quants = Quant.search([
            ("product_id", "=", product.id),
            ("location_id", "=", stock_loc.id),
        ])
        if not quants:
            continue
        q = quants[0]
        q.write({"quantity": max(0, q.quantity - line.quantity)})
        total += line.quantity
    return total


def simulate(env):
    company = env.user.company_id
    Order = env["hashtap.order"].sudo()
    Line = env["hashtap.order.line"].sudo()
    Item = env["hashtap.menu.item"].sudo()

    # Önceki simülasyon siparişlerini temizle — customer_note 'SIM-' ile işaretliyoruz
    previous = Order.search([("customer_note", "=like", "SIM-%")])
    if previous:
        _logger.info("Temizleniyor: %d önceki simülasyon siparişi", len(previous))
        # Moves + invoices'ı da temizle
        moves = env["stock.move"].search([("origin", "in", previous.mapped("name"))])
        for m in moves:
            if m.state == "done":
                # iade edemeyiz; sadece state='done' olan iptal edilmez. atla.
                pass
        invoices = env["account.move"].search([("invoice_origin", "in", previous.mapped("name"))])
        for inv in invoices:
            if inv.state == "posted":
                try:
                    inv.button_cancel()
                except Exception:  # noqa: BLE001
                    pass
            inv.unlink()
        previous.unlink()

    # Aktif masalar
    tables = env["restaurant.table"].sudo().search([
        ("active", "=", True),
        ("hashtap_enabled", "=", True),
    ])
    if not tables:
        _logger.error("Masa yok — önce seed_demo çalıştır.")
        return

    # Menü öğelerini kategoriye göre grupla
    all_items = Item.search([("active", "=", True)])
    by_cat = {}
    for it in all_items:
        key = it.category_id.name_tr
        by_cat.setdefault(key, []).append(it)

    # Ortak altyapı
    partner = find_or_create_walkin(env, company)
    journal, income_account = ensure_accounts(env, company)
    if not income_account:
        _logger.error("Gelir hesabı yok — l10n_tr kurulu mu?")
        return
    set_product_income_accounts(env, income_account)
    Locations = env["stock.location"]
    stock_loc = Locations.search([
        ("usage", "=", "internal"),
        ("company_id", "=", company.id),
    ], limit=1)

    # Bugün ve geriye 3 gün (bugün dahil)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    today = now.date()
    days = [
        (today - timedelta(days=3), 45),   # 3 gün önce
        (today - timedelta(days=2), 60),   # 2 gün önce
        (today - timedelta(days=1), 55),   # dün
        (today, 25),                         # bugün (sabah+öğle)
    ]

    total_orders = 0
    total_revenue_kurus = 0

    for day, order_count in days:
        _logger.info("Simüle ediliyor: %s (%d sipariş)", day, order_count)
        day_orders = []
        for _ in range(order_count):
            hour, minute = simulated_hour_distribution()
            # bugün için gelecek saatleri atla
            if day == today and hour > now.hour:
                hour = min(hour, now.hour)
            created_at = datetime.combine(day, datetime.min.time()).replace(
                hour=hour, minute=minute, second=random.randint(0, 59),
            )

            # Masa seç
            table = random.choice(list(tables))

            # 2-5 kalem, 1-3 adet
            line_count = random.randint(2, 5)
            picked = pick_items(by_cat, line_count)

            # Sipariş oluştur
            order = Order.create({
                "table_id": table.id,
                "state": "placed",
                "payment_state": "unpaid",
                "require_receipt": False,
                "customer_note": f"SIM-{day.isoformat()}",
            })
            for item in picked:
                qty = random.choices([1, 1, 1, 2, 2, 3], k=1)[0]
                price_k = int(round(float(item.product_tmpl_id.list_price or 0) * 100))
                if price_k <= 0:
                    continue  # ikram, saymaz
                Line.create({
                    "order_id": order.id,
                    "item_id": item.id,
                    "item_name": item.name_tr,
                    "unit_price_kurus": price_k,
                    "quantity": qty,
                })

            # Backdate create_date
            env.cr.execute(
                "UPDATE hashtap_order SET create_date=%s WHERE id=%s",
                (created_at, order.id),
            )

            # Ödeme
            method = weighted_pick(PAYMENT_MIX)
            order.payment_method_code = method
            order.action_mark_paid_offline()

            # Durum ilerlet → served (past siparişler tamamen servis edilmiş)
            # action_mark_paid_offline _fire_kitchen çağırır → state=kitchen_sent
            if day < today or (day == today and hour < (now.hour - 1)):
                # Eski sipariş, tamamen servis
                order.action_mark_preparing()
                order.action_mark_ready()
                env.cr.execute(
                    "UPDATE hashtap_order SET ready_at=%s WHERE id=%s",
                    (created_at + timedelta(minutes=25), order.id),
                )
                order.action_mark_served()
            # kitchen_fired_at ile ready_at'ı da backdate et
            env.cr.execute(
                "UPDATE hashtap_order SET kitchen_fired_at=%s WHERE id=%s",
                (created_at + timedelta(minutes=1), order.id),
            )

            # Stok düşümü (quant direct)
            try:
                write_stock_out(env, order, stock_loc)
            except Exception as e:  # noqa: BLE001
                _logger.warning("stock decrement failed for %s: %s", order.name, e)

            # Fatura (invoice)
            try:
                inv = create_invoice(env, order, partner, journal, income_account)
                # Fatura tarihini de geçmişe çek
                if inv.state == "posted":
                    env.cr.execute(
                        "UPDATE account_move SET invoice_date=%s, date=%s WHERE id=%s",
                        (created_at.date(), created_at.date(), inv.id),
                    )
            except Exception as e:  # noqa: BLE001
                _logger.warning("invoice failed for %s: %s", order.name, e)

            day_orders.append(order)
            total_orders += 1
            total_revenue_kurus += order.total_kurus

        env.cr.commit()
        day_total = sum(o.total_kurus for o in day_orders) / 100.0
        _logger.info(
            "  %s günü: %d sipariş, ciro %.2f TL",
            day.isoformat(), len(day_orders), day_total,
        )

    _logger.info(
        "Simülasyon tamam — toplam %d sipariş, %.2f TL ciro",
        total_orders, total_revenue_kurus / 100.0,
    )


# Odoo shell execution
simulate(env)
print("✓ HashTap 3+ günlük simülasyon tamam")
