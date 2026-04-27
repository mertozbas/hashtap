"""Generic Odoo tool — Cloudflare pattern.

Model + method + args/kwargs ile HashTap'in tüm Odoo modellerine
erişim. Discovery (model='_' veya method='_') ile keşif gömülü.
Faz 1'de yalnızca okuma metodları (READ_ONLY_METHODS) çalışır.
"""
from __future__ import annotations

import json
import time
import traceback
from typing import Any

from strands import tool

from ..odoo_client import READ_ONLY_METHODS, get_client, redact


@tool
def use_hashtap(
    model: str,
    method: str,
    args: list | None = None,
    kwargs: dict | None = None,
) -> dict:
    """HashTap restoran sisteminin tüm veri modellerine evrensel erişim.

    Model + method belirterek herhangi bir Odoo modelinde okuma yapar.
    Yaygın model isimleri: hashtap.order, hashtap.menu.item,
    hashtap.menu.category, restaurant.table, stock.quant, account.move,
    hashtap.day.close, res.company, res.partner.

    Discovery (keşif):
        use_hashtap(model="_", method="_") → tüm hashtap.* modeller
        use_hashtap(model="hashtap.order", method="_") → modelin metodları

    Faz 1 izinli metodlar: search, search_read, read, name_get,
    name_search, fields_get, search_count, default_get.

    Args:
        model: Odoo model adı (ör. "hashtap.order"). "_" ile keşif.
        method: Metod adı (ör. "search_read", "read"). "_" ile keşif.
        args: Pozisyonel argümanlar (örn. domain için [[...]]).
        kwargs: Keyword argümanları (fields, limit, order, offset).

    Returns:
        {"status": "success", "result": [...]} veya hata.

    Examples:
        # Bugün açık siparişler
        use_hashtap(
            model="hashtap.order",
            method="search_read",
            args=[[["state", "in", ["kitchen_sent", "preparing", "ready"]]]],
            kwargs={"fields": ["name", "table_id", "total_kurus"], "limit": 50},
        )

        # Bir masa
        use_hashtap(
            model="restaurant.table",
            method="search_read",
            args=[[["name", "=", "A4"]]],
            kwargs={"fields": ["name", "seats", "hashtap_qr_slug"]},
        )

        # Düşük stok
        use_hashtap(
            model="stock.quant",
            method="search_read",
            args=[[["quantity", "<", 10]]],
            kwargs={"fields": ["product_id", "quantity", "location_id"]},
        )
    """
    t0 = time.time()
    client = get_client()

    # Discovery
    if model == "_" or method == "_":
        if model == "_":
            models = client.list_models("hashtap")
            return {
                "status": "success",
                "result": {"models": models, "count": len(models)},
                "ms": int((time.time() - t0) * 1000),
            }
        # method == "_"
        return {
            "status": "success",
            "result": {
                "model": model,
                "methods_available_now": sorted(READ_ONLY_METHODS),
                "methods_locked_phase1": ["create", "write", "unlink"],
                "tip": "Bu fazda yalnızca okuma metodları açık.",
            },
            "ms": int((time.time() - t0) * 1000),
        }

    # Faz 1: yalnızca okuma metodları
    if method not in READ_ONLY_METHODS:
        return {
            "status": "error",
            "error": "method_not_allowed",
            "message": (
                f"Faz 1'de '{method}' metodu kullanılamaz. "
                f"Açık metodlar: {sorted(READ_ONLY_METHODS)}"
            ),
        }

    try:
        result = client.execute_kw(model, method, args or [], kwargs or {})
    except Exception as e:  # noqa: BLE001
        return {
            "status": "error",
            "error": type(e).__name__,
            "message": str(e),
            "trace": traceback.format_exc(limit=3),
        }

    return {
        "status": "success",
        "model": model,
        "method": method,
        "result": redact(result),
        "ms": int((time.time() - t0) * 1000),
    }
