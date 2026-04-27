"""Rapor üretimi — markdown tablo formatında geçmiş günün Z raporu."""
from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time, timedelta

from strands import tool

from ..odoo_client import get_client


def _kurus(v: int | float) -> float:
    return round((v or 0) / 100.0, 2)


def _format_tl(kurus: int) -> str:
    return f"{kurus / 100:,.2f} ₺".replace(",", "X").replace(".", ",").replace("X", ".")


METHOD_LABELS = {
    "card": "Kart (3DS)",
    "card_manual": "Kart (harici)",
    "apple_pay": "Apple Pay",
    "google_pay": "Google Pay",
    "cash": "Nakit",
    "pay_at_counter": "Karma / kasada",
    "": "Belirsiz",
}


@tool
def gun_raporu(gun: str) -> dict:
    """Geçmiş bir günün tam Z raporunu markdown tablosu olarak döner.

    Args:
        gun: ISO tarihi (YYYY-MM-DD), örn. "2026-04-26".

    Returns:
        markdown formatlı rapor + ham metrikler.
    """
    try:
        d = datetime.strptime(gun, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return {
            "status": "error",
            "message": f"'{gun}' geçerli bir tarih değil. ISO format: YYYY-MM-DD.",
        }

    client = get_client()
    start = datetime.combine(d, time.min)
    end = start + timedelta(days=1)

    orders = client.search_read(
        "hashtap.order",
        [
            ["create_date", ">=", start.strftime("%Y-%m-%d %H:%M:%S")],
            ["create_date", "<", end.strftime("%Y-%m-%d %H:%M:%S")],
            ["state", "!=", "cancelled"],
        ],
        fields=[
            "id",
            "name",
            "state",
            "payment_state",
            "payment_method_code",
            "total_kurus",
            "paid_amount_kurus",
        ],
        limit=2000,
    )

    if not orders:
        return {
            "status": "success",
            "day": gun,
            "markdown": f"# Z Raporu — {gun}\n\nBu gün için sipariş kaydı yok.",
            "totals": {"orders": 0},
        }

    paid = [o for o in orders if o["payment_state"] == "paid"]
    by_method: dict[str, dict] = defaultdict(lambda: {"orders": 0, "kurus": 0})
    for o in orders:
        m = o.get("payment_method_code") or ""
        by_method[m]["orders"] += 1
        by_method[m]["kurus"] += o["paid_amount_kurus"]

    gross_kurus = sum(o["total_kurus"] for o in orders)
    collected_kurus = sum(o["paid_amount_kurus"] for o in orders)

    # Z raporu kaydı (varsa)
    closures = client.search_read(
        "hashtap.day.close",
        [["day", "=", gun]],
        fields=[
            "name",
            "cash_system_kurus",
            "cash_counted_kurus",
            "diff_kurus",
            "note",
            "create_date",
        ],
        limit=1,
    )
    closure = closures[0] if closures else None

    # Markdown rapor
    lines = [
        f"# Z Raporu — {gun}",
        "",
        "| Metrik | Değer |",
        "|---|---|",
        f"| Sipariş sayısı | {len(orders)} |",
        f"| Ödenen | {len(paid)} |",
        f"| Açık | {len(orders) - len(paid)} |",
        f"| Brüt ciro | **{_format_tl(gross_kurus)}** |",
        f"| Tahsilat | **{_format_tl(collected_kurus)}** |",
        "",
        "## Ödeme yöntemine göre dağılım",
        "",
        "| Yöntem | Sipariş | Tutar |",
        "|---|---|---|",
    ]
    for code, vals in sorted(by_method.items(), key=lambda x: -x[1]["kurus"]):
        lbl = METHOD_LABELS.get(code, code or "—")
        lines.append(f"| {lbl} | {vals['orders']} | {_format_tl(vals['kurus'])} |")

    if closure:
        lines += [
            "",
            "## Kasa sayımı",
            "",
            f"- Sistem nakit: **{_format_tl(closure['cash_system_kurus'])}**",
            f"- Sayım nakit: **{_format_tl(closure['cash_counted_kurus'])}**",
            f"- Fark: **{_format_tl(closure['diff_kurus'])}**",
        ]
        if closure.get("note"):
            lines.append(f"- Not: {closure['note']}")

    return {
        "status": "success",
        "day": gun,
        "markdown": "\n".join(lines),
        "totals": {
            "orders": len(orders),
            "paid": len(paid),
            "gross_tl": _kurus(gross_kurus),
            "collected_tl": _kurus(collected_kurus),
        },
        "by_method": [
            {
                "code": code,
                "label": METHOD_LABELS.get(code, code or "—"),
                "orders": v["orders"],
                "tl": _kurus(v["kurus"]),
            }
            for code, v in by_method.items()
        ],
        "closure": {
            "cash_system_tl": _kurus(closure["cash_system_kurus"]),
            "cash_counted_tl": _kurus(closure["cash_counted_kurus"]),
            "diff_tl": _kurus(closure["diff_kurus"]),
            "note": closure.get("note"),
        }
        if closure
        else None,
    }
