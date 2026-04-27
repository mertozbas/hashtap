"""Sipariş + masa odaklı tool'lar."""
from __future__ import annotations

from strands import tool

from ..odoo_client import get_client


def _kurus(v: int | float) -> float:
    return round((v or 0) / 100.0, 2)


@tool
def aktif_siparisler(masa: str | None = None) -> dict:
    """Şu an açık (placed/kitchen_sent/preparing/ready) siparişler.

    Args:
        masa: Opsiyonel masa adı filtresi (örn. "A4"). Boş ise tümü.
    """
    client = get_client()
    domain = [["state", "in", ["placed", "kitchen_sent", "preparing", "ready"]]]
    if masa:
        # masa adıyla restaurant.table'da ara, id'leri al
        tables = client.search_read(
            "restaurant.table",
            [["name", "=", masa]],
            fields=["id", "name"],
            limit=5,
        )
        if not tables:
            return {"status": "success", "masa": masa, "orders": [], "note": "Masa bulunamadı."}
        domain.append(["table_id", "in", [t["id"] for t in tables]])

    orders = client.search_read(
        "hashtap.order",
        domain,
        fields=[
            "name",
            "state",
            "payment_state",
            "total_kurus",
            "table_id",
            "create_date",
            "kitchen_fired_at",
            "ready_at",
        ],
        order="create_date desc",
        limit=50,
    )

    by_state: dict[str, int] = {}
    for o in orders:
        by_state[o["state"]] = by_state.get(o["state"], 0) + 1

    return {
        "status": "success",
        "filter_masa": masa,
        "count": len(orders),
        "by_state": by_state,
        "total_tl": _kurus(sum(o["total_kurus"] for o in orders)),
        "orders": [
            {
                "ref": o["name"],
                "table": o["table_id"][1] if o["table_id"] else None,
                "state": o["state"],
                "paid": o["payment_state"] == "paid",
                "total_tl": _kurus(o["total_kurus"]),
                "opened": o["create_date"],
                "fired": o.get("kitchen_fired_at") or None,
                "ready": o.get("ready_at") or None,
            }
            for o in orders
        ],
    }


@tool
def masa_durumu(masa_adi: str) -> dict:
    """Bir masanın açık siparişleri, kalemleri, tutarı, açılış saati.

    Args:
        masa_adi: Masa adı (örn. "A4", "T2").
    """
    client = get_client()
    tables = client.search_read(
        "restaurant.table",
        [["name", "=", masa_adi]],
        fields=["id", "name", "seats", "floor_id", "hashtap_qr_slug"],
        limit=1,
    )
    if not tables:
        return {"status": "error", "message": f"'{masa_adi}' adında masa yok."}
    table = tables[0]

    orders = client.search_read(
        "hashtap.order",
        [
            ["table_id", "=", table["id"]],
            ["state", "in", ["placed", "paid", "kitchen_sent", "preparing", "ready"]],
        ],
        fields=[
            "name",
            "state",
            "payment_state",
            "total_kurus",
            "create_date",
            "customer_note",
        ],
        order="create_date desc",
    )

    enriched_orders = []
    for o in orders:
        lines = client.search_read(
            "hashtap.order.line",
            [["order_id", "=", o["id"]]],
            fields=["item_name", "quantity", "subtotal_kurus", "note"],
            order="sequence,id",
        )
        enriched_orders.append({
            "ref": o["name"],
            "state": o["state"],
            "paid": o["payment_state"] == "paid",
            "total_tl": _kurus(o["total_kurus"]),
            "opened": o["create_date"],
            "note": o.get("customer_note") or None,
            "lines": [
                {
                    "name": ln["item_name"],
                    "qty": ln["quantity"],
                    "subtotal_tl": _kurus(ln["subtotal_kurus"]),
                    "line_note": ln.get("note") or None,
                }
                for ln in lines
            ],
        })

    return {
        "status": "success",
        "table": {
            "name": table["name"],
            "seats": table["seats"] or 0,
            "floor": table["floor_id"][1] if table["floor_id"] else None,
            "qr_slug": table.get("hashtap_qr_slug"),
        },
        "open_order_count": len(enriched_orders),
        "total_open_tl": sum(o["total_tl"] for o in enriched_orders),
        "orders": enriched_orders,
    }
