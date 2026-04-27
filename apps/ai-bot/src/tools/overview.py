"""Yüksek seviyeli özet tool'ları — bugun_ozeti, hafta_karsilastirma, peak_saatler."""
from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time, timedelta

from strands import tool

from ..odoo_client import get_client


def _kurus(v: int | float) -> float:
    return round((v or 0) / 100.0, 2)


@tool
def bugun_ozeti() -> dict:
    """Bugünkü tablo: sipariş sayısı, ciro, ortalama, peak saat, en çok satan.

    Patron "bugün ne yapıyoruz?" dediğinde ilk çağırılacak tool.
    Tek çağrıda 4-5 metrik döner; ek detay için diğer tool'lara geçer.
    """
    client = get_client()
    today = date.today()
    start = datetime.combine(today, time.min).strftime("%Y-%m-%d %H:%M:%S")
    end = (datetime.combine(today, time.min) + timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")

    orders = client.search_read(
        "hashtap.order",
        [["create_date", ">=", start], ["create_date", "<", end], ["state", "!=", "cancelled"]],
        fields=[
            "name",
            "state",
            "payment_state",
            "total_kurus",
            "paid_amount_kurus",
            "create_date",
            "table_id",
            "payment_method_code",
        ],
        limit=500,
    )

    paid = [o for o in orders if o["payment_state"] == "paid"]
    open_count = sum(1 for o in orders if o["payment_state"] != "paid")
    in_kitchen = sum(1 for o in orders if o["state"] in ("kitchen_sent", "preparing"))
    ready = sum(1 for o in orders if o["state"] == "ready")

    gross_kurus = sum(o["total_kurus"] for o in orders)
    collected_kurus = sum(o["paid_amount_kurus"] for o in orders)

    # Saat dağılımı (peak)
    by_hour: dict[int, int] = defaultdict(int)
    for o in orders:
        try:
            h = datetime.fromisoformat(o["create_date"].replace(" ", "T")).hour
            by_hour[h] += 1
        except Exception:  # noqa: BLE001
            continue
    peak_hour = max(by_hour.items(), key=lambda x: x[1]) if by_hour else (None, 0)

    # En çok satan ürün (sipariş satırlarından)
    top_item = None
    if orders:
        order_ids = [o["id"] for o in orders]
        lines = client.search_read(
            "hashtap.order.line",
            [["order_id", "in", order_ids]],
            fields=["item_name", "quantity", "subtotal_kurus"],
            limit=2000,
        )
        agg: dict[str, dict] = defaultdict(lambda: {"qty": 0, "revenue": 0})
        for ln in lines:
            agg[ln["item_name"]]["qty"] += ln["quantity"]
            agg[ln["item_name"]]["revenue"] += ln["subtotal_kurus"]
        if agg:
            top = max(agg.items(), key=lambda x: x[1]["revenue"])
            top_item = {
                "name": top[0],
                "qty": top[1]["qty"],
                "revenue_tl": _kurus(top[1]["revenue"]),
            }

    return {
        "status": "success",
        "day": today.isoformat(),
        "totals": {
            "orders": len(orders),
            "paid": len(paid),
            "open": open_count,
            "in_kitchen": in_kitchen,
            "ready": ready,
            "gross_tl": _kurus(gross_kurus),
            "collected_tl": _kurus(collected_kurus),
        },
        "peak_hour": {"hour": peak_hour[0], "orders_in_hour": peak_hour[1]},
        "top_item": top_item,
    }


@tool
def hafta_karsilastirma() -> dict:
    """Bu hafta vs geçen hafta ciro/sipariş karşılaştırması.

    Pazartesi 00:00'dan başlayarak 7 günlük iki dilim hesaplar.
    """
    client = get_client()
    today = date.today()
    week_start = today - timedelta(days=today.weekday())  # bu Pzt
    last_week_start = week_start - timedelta(days=7)

    def slice_orders(start: date, end: date) -> list[dict]:
        return client.search_read(
            "hashtap.order",
            [
                ["create_date", ">=", datetime.combine(start, time.min).strftime("%Y-%m-%d %H:%M:%S")],
                ["create_date", "<", datetime.combine(end, time.min).strftime("%Y-%m-%d %H:%M:%S")],
                ["state", "!=", "cancelled"],
            ],
            fields=["total_kurus", "payment_state"],
            limit=2000,
        )

    this_week = slice_orders(week_start, today + timedelta(days=1))
    last_week = slice_orders(last_week_start, week_start)

    def summarize(orders: list[dict]) -> dict:
        total = sum(o["total_kurus"] for o in orders)
        return {
            "orders": len(orders),
            "gross_tl": _kurus(total),
        }

    a = summarize(this_week)
    b = summarize(last_week)
    pct = lambda x, y: round(((x - y) / y * 100), 1) if y else None  # noqa: E731

    return {
        "status": "success",
        "this_week": {"start": week_start.isoformat(), "end": today.isoformat(), **a},
        "last_week": {
            "start": last_week_start.isoformat(),
            "end": week_start.isoformat(),
            **b,
        },
        "delta": {
            "orders_pct": pct(a["orders"], b["orders"]),
            "gross_pct": pct(a["gross_tl"], b["gross_tl"]),
        },
    }


@tool
def peak_saatler(gun_sayisi: int = 7) -> dict:
    """Son N günün saat-saat sipariş yoğunluğu.

    Saatlik sayım + en yoğun saatler listesi. Mutfak vardiya
    planlaması için.

    Args:
        gun_sayisi: Geriye dönük gün sayısı (1-30 arası).
    """
    gun_sayisi = max(1, min(int(gun_sayisi or 7), 30))
    client = get_client()
    end = datetime.combine(date.today(), time.min) + timedelta(days=1)
    start = end - timedelta(days=gun_sayisi)

    orders = client.search_read(
        "hashtap.order",
        [
            ["create_date", ">=", start.strftime("%Y-%m-%d %H:%M:%S")],
            ["create_date", "<", end.strftime("%Y-%m-%d %H:%M:%S")],
            ["state", "!=", "cancelled"],
        ],
        fields=["create_date", "total_kurus"],
        limit=10000,
    )

    by_hour: dict[int, dict] = defaultdict(lambda: {"orders": 0, "gross_kurus": 0})
    for o in orders:
        try:
            h = datetime.fromisoformat(o["create_date"].replace(" ", "T")).hour
            by_hour[h]["orders"] += 1
            by_hour[h]["gross_kurus"] += o["total_kurus"]
        except Exception:  # noqa: BLE001
            continue

    rows = sorted(
        [
            {
                "hour": h,
                "orders": v["orders"],
                "gross_tl": _kurus(v["gross_kurus"]),
            }
            for h, v in by_hour.items()
        ],
        key=lambda x: x["hour"],
    )

    top3 = sorted(rows, key=lambda x: x["orders"], reverse=True)[:3]

    return {
        "status": "success",
        "window_days": gun_sayisi,
        "by_hour": rows,
        "peak_top3": top3,
    }
