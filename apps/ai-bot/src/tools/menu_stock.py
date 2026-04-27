"""Menü ve stok tool'ları — en çok satan, düşük stok."""
from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time, timedelta

from strands import tool

from ..odoo_client import get_client


def _kurus(v: int | float) -> float:
    return round((v or 0) / 100.0, 2)


@tool
def en_cok_satan(gun_sayisi: int = 7, limit: int = 10) -> dict:
    """Son N günün en çok satan ürünleri (adet ve gelir).

    Args:
        gun_sayisi: Geriye dönük gün sayısı (1-90).
        limit: Kaç ürün dönsün (1-50).
    """
    gun_sayisi = max(1, min(int(gun_sayisi or 7), 90))
    limit = max(1, min(int(limit or 10), 50))
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
        fields=["id"],
        limit=10000,
    )
    if not orders:
        return {
            "status": "success",
            "window_days": gun_sayisi,
            "items": [],
            "note": "Bu pencerede sipariş yok.",
        }

    lines = client.search_read(
        "hashtap.order.line",
        [["order_id", "in", [o["id"] for o in orders]]],
        fields=["item_id", "item_name", "quantity", "subtotal_kurus"],
        limit=50000,
    )

    agg: dict[int, dict] = defaultdict(lambda: {"name": "", "qty": 0, "revenue": 0})
    for ln in lines:
        item_id = ln["item_id"][0] if ln.get("item_id") else 0
        agg[item_id]["name"] = ln["item_name"]
        agg[item_id]["qty"] += ln["quantity"]
        agg[item_id]["revenue"] += ln["subtotal_kurus"]

    rows = sorted(
        [
            {
                "name": v["name"],
                "qty": v["qty"],
                "revenue_tl": _kurus(v["revenue"]),
            }
            for v in agg.values()
        ],
        key=lambda r: r["revenue_tl"],
        reverse=True,
    )[:limit]

    return {
        "status": "success",
        "window_days": gun_sayisi,
        "limit": limit,
        "items": rows,
    }


@tool
def dusuk_stok(esik: int = 10) -> dict:
    """Stoğu eşik altına düşmüş ürünler (yenilenecekler).

    Args:
        esik: Stok eşiği (varsayılan 10 birim).
    """
    esik = max(0, int(esik or 10))
    client = get_client()

    # İç (internal) konumdaki quant'ları çek
    quants = client.search_read(
        "stock.quant",
        [
            ["quantity", "<=", esik],
            ["location_id.usage", "=", "internal"],
        ],
        fields=["product_id", "quantity", "location_id"],
        order="quantity asc",
        limit=200,
    )

    # Sadece HashTap menü öğesi olan ürünleri filtrele
    if not quants:
        return {"status": "success", "threshold": esik, "items": []}

    product_ids = list({q["product_id"][0] for q in quants if q.get("product_id")})
    products = client.search_read(
        "product.product",
        [["id", "in", product_ids]],
        fields=["id", "name", "product_tmpl_id"],
    )
    p_by_id = {p["id"]: p for p in products}

    tmpl_ids = list({p["product_tmpl_id"][0] for p in products if p.get("product_tmpl_id")})
    menu_items = client.search_read(
        "hashtap.menu.item",
        [["product_tmpl_id", "in", tmpl_ids]],
        fields=["product_tmpl_id", "name_tr"],
    )
    is_menu = {mi["product_tmpl_id"][0] for mi in menu_items if mi.get("product_tmpl_id")}

    rows = []
    for q in quants:
        if not q.get("product_id"):
            continue
        pid = q["product_id"][0]
        prod = p_by_id.get(pid)
        if not prod:
            continue
        tmpl_id = prod["product_tmpl_id"][0] if prod.get("product_tmpl_id") else None
        if tmpl_id not in is_menu:
            continue  # menüde olmayan ürünleri atla (yöneticinin gözünde tedbir öncelik)
        rows.append({
            "product": prod["name"],
            "qty": int(q["quantity"]),
            "location": q["location_id"][1] if q.get("location_id") else None,
        })

    return {
        "status": "success",
        "threshold": esik,
        "count": len(rows),
        "items": rows,
    }
