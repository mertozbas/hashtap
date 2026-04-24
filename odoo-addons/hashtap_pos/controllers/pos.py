"""Cashier / Waiter backend endpoint'leri.

`/hashtap/pos/*` altında, masa yönetimi + sipariş + ödeme için kasa/garson
arayüzlerinin kullandığı toplu API. Gateway BFF `/v1/pos/*` olarak proxy
eder.

Authentication: şu anda public (yerel ağ varsayımı). Prod'da `auth=user`
veya basic_auth eklenecek.
"""
import logging

from odoo import http, fields
from odoo.http import request

_logger = logging.getLogger(__name__)


def _json(payload, status=200):
    return request.make_json_response(payload, status=status)


def _serialize_line(line):
    return {
        "id": line.id,
        "item_id": line.item_id.id,
        "item_name": line.item_name,
        "quantity": line.quantity,
        "unit_price_kurus": line.unit_price_kurus,
        "modifier_total_kurus": line.modifier_total_kurus,
        "subtotal_kurus": line.subtotal_kurus,
        "note": line.note or "",
    }


def _serialize_order(order):
    return {
        "id": order.id,
        "reference": order.name,
        "state": order.state,
        "payment_state": order.payment_state,
        "payment_method_code": order.payment_method_code or "",
        "earsiv_state": order.earsiv_state,
        "paid_amount_kurus": order.paid_amount_kurus,
        "subtotal_kurus": order.subtotal_kurus,
        "total_kurus": order.total_kurus,
        "currency": order.currency,
        "table_id": order.table_id.id,
        "table_slug": order.table_slug or "",
        "table_name": order.table_id.name,
        "customer_note": order.customer_note or "",
        "created_at": order.create_date.isoformat() if order.create_date else None,
        "kitchen_fired_at": (
            order.kitchen_fired_at.isoformat() if order.kitchen_fired_at else None
        ),
        "ready_at": order.ready_at.isoformat() if order.ready_at else None,
        "lines": [_serialize_line(l) for l in order.line_ids],
    }


def _table_status(table, active_orders_map):
    orders = active_orders_map.get(table.id, [])
    if not orders:
        return "free"
    by_state = {o.state for o in orders}
    by_payment = {o.payment_state for o in orders}
    if "ready" in by_state:
        return "ready"
    if "paid" in by_state and "paid" not in by_payment:
        # shouldn't really happen, but guard
        return "occupied"
    # herhangi bir unpaid paid-olmayan açık siparişli masa "hesap bekliyor"
    # değil — hesap isteği ayrı bir sinyal (gelecek)
    if any(o.payment_state == "paid" and o.state in ("placed", "paid", "kitchen_sent") for o in orders):
        return "open"
    return "occupied"


class HashTapPos(http.Controller):
    """Cashier + Waiter için backend API."""

    # -------------------------------------------------------- Tables ----
    @http.route(
        "/hashtap/pos/tables",
        type="http", auth="public", methods=["GET"], csrf=False,
    )
    def list_tables(self, **_kw):
        tables = (
            request.env["restaurant.table"]
            .sudo()
            .search([("active", "=", True), ("hashtap_enabled", "=", True)],
                    order="name")
        )

        active_orders = request.env["hashtap.order"].sudo().search([
            ("state", "in", ("placed", "paid", "kitchen_sent", "preparing", "ready")),
            ("table_id", "in", tables.ids),
        ])
        by_table = {}
        for o in active_orders:
            by_table.setdefault(o.table_id.id, []).append(o)

        payload = []
        for table in tables:
            orders = by_table.get(table.id, [])
            total = sum(o.total_kurus for o in orders)
            payload.append({
                "id": table.id,
                "name": table.name,
                "identifier": table.identifier,
                "floor": table.floor_id.name or "",
                "seats": table.seats or 0,
                "slug": table.hashtap_qr_slug or "",
                "status": _table_status(table, by_table),
                "active_order_count": len(orders),
                "active_total_kurus": total,
            })
        return _json({"tables": payload})

    @http.route(
        "/hashtap/pos/tables/<int:table_id>",
        type="http", auth="public", methods=["GET"], csrf=False,
    )
    def table_detail(self, table_id, **_kw):
        table = request.env["restaurant.table"].sudo().browse(table_id).exists()
        if not table:
            return _json({"error": "table_not_found"}, status=404)

        orders = (
            request.env["hashtap.order"]
            .sudo()
            .search([
                ("table_id", "=", table_id),
                ("state", "in",
                 ("placed", "paid", "kitchen_sent", "preparing", "ready")),
            ], order="create_date desc")
        )
        return _json({
            "table": {
                "id": table.id,
                "name": table.name,
                "identifier": table.identifier,
                "floor": table.floor_id.name or "",
                "seats": table.seats or 0,
                "slug": table.hashtap_qr_slug or "",
            },
            "orders": [_serialize_order(o) for o in orders],
        })

    # -------------------------------------------------------- Orders ----
    @http.route(
        "/hashtap/pos/orders",
        type="http", auth="public", methods=["GET"], csrf=False,
    )
    def list_orders(self, state="active", **_kw):
        """Sipariş listesi — kasa ana ekranı için.

        state: "active" (default) | "paid" | "served" | "all"
        """
        states = {
            "active": ["placed", "paid", "kitchen_sent", "preparing", "ready"],
            "paid": ["paid", "kitchen_sent", "preparing", "ready", "served"],
            "served": ["served"],
            "unpaid": ["placed"],
        }
        if state == "all":
            domain = []
        else:
            domain = [("state", "in", states.get(state, states["active"]))]
        orders = (
            request.env["hashtap.order"].sudo().search(domain, order="create_date desc", limit=200)
        )
        return _json({"orders": [_serialize_order(o) for o in orders]})

    @http.route(
        "/hashtap/pos/orders/<int:order_id>",
        type="http", auth="public", methods=["GET"], csrf=False,
    )
    def order_detail(self, order_id, **_kw):
        order = request.env["hashtap.order"].sudo().browse(order_id).exists()
        if not order:
            return _json({"error": "order_not_found"}, status=404)
        return _json({"order": _serialize_order(order)})

    @http.route(
        "/hashtap/pos/orders",
        type="json", auth="public", methods=["POST"], csrf=False,
    )
    def create_order(self, table_id=None, items=None, customer_note=None,
                     require_receipt=False, **_kw):
        """Kasa ve garson arayüzünden sipariş girişi.

        Yerel ağda kasa operatörü güvenilir sayılır; kimlik doğrulaması
        sonra eklenecek. Kasa siparişlerinde require_receipt varsayılanı
        False (ödeme kasadan alındığında ÖKC/e-Arşiv manuel akış).
        """
        items = items or []
        if not isinstance(table_id, int):
            return {"error": "bad_table"}
        if not isinstance(items, list) or not items:
            return {"error": "empty_cart"}

        table = request.env["restaurant.table"].sudo().browse(table_id).exists()
        if not table:
            return {"error": "table_not_found"}

        Item = request.env["hashtap.menu.item"].sudo()
        Order = request.env["hashtap.order"].sudo()
        Line = request.env["hashtap.order.line"].sudo()

        order = Order.create({
            "table_id": table.id,
            "state": "placed",
            "payment_state": "unpaid",
            "require_receipt": bool(require_receipt),
            "customer_note": (customer_note or "").strip()[:500] or False,
        })

        for raw in items:
            if not isinstance(raw, dict):
                continue
            item_id = raw.get("item_id")
            qty = int(raw.get("quantity") or 1)
            note = (raw.get("note") or "").strip()[:300]
            item = Item.browse(item_id).exists() if isinstance(item_id, int) else None
            if not item:
                continue
            price_kurus = int(round(float(item.product_tmpl_id.list_price or 0) * 100))
            Line.create({
                "order_id": order.id,
                "item_id": item.id,
                "item_name": item.name_tr,
                "unit_price_kurus": price_kurus,
                "quantity": max(1, min(qty, 20)),
                "note": note or False,
            })

        return {"order": _serialize_order(order)}

    # ----------------------------------------------- State Transitions --
    @http.route(
        "/hashtap/pos/orders/<int:order_id>/fire",
        type="json", auth="public", methods=["POST"], csrf=False,
    )
    def fire_kitchen(self, order_id, **_kw):
        """Sipariş mutfağa gönder — kasa/garson iş akışı.

        Ödeme beklemeksizin mutfağa düşürme. Fail-close hala geçerli:
        require_receipt=True ise e-Arşiv geçmeden engellenir.
        """
        order = request.env["hashtap.order"].sudo().browse(order_id).exists()
        if not order:
            return {"error": "order_not_found"}
        try:
            order.action_mark_kitchen_sent()
        except Exception as e:  # noqa: BLE001
            return {"error": "cannot_fire", "detail": str(e)}
        return {"order": _serialize_order(order)}

    @http.route(
        "/hashtap/pos/orders/<int:order_id>/advance",
        type="json", auth="public", methods=["POST"], csrf=False,
    )
    def advance(self, order_id, **_kw):
        """kitchen_sent → preparing → ready → served."""
        order = request.env["hashtap.order"].sudo().browse(order_id).exists()
        if not order:
            return {"error": "order_not_found"}
        transitions = {
            "kitchen_sent": "action_mark_preparing",
            "preparing": "action_mark_ready",
            "ready": "action_mark_served",
        }
        step = transitions.get(order.state)
        if not step:
            return {"error": "invalid_state", "state": order.state}
        getattr(order, step)()
        return {"order": _serialize_order(order)}

    @http.route(
        "/hashtap/pos/orders/<int:order_id>/cancel",
        type="json", auth="public", methods=["POST"], csrf=False,
    )
    def cancel(self, order_id, **_kw):
        order = request.env["hashtap.order"].sudo().browse(order_id).exists()
        if not order:
            return {"error": "order_not_found"}
        order.action_cancel()
        return {"order": _serialize_order(order)}

    # ------------------------------------------------------- Payment ----
    @http.route(
        "/hashtap/pos/orders/<int:order_id>/pay",
        type="json", auth="public", methods=["POST"], csrf=False,
    )
    def pay_offline(self, order_id, method_code="cash", amount_kurus=None,
                    **_kw):
        """Kasada nakit / kart (sanalpos dışı) ödeme al.

        method_code: "cash" | "pay_at_counter" | "card_manual"
        Bu endpoint iyzico 3DS akışını kullanmaz — kasa operatörü manuel
        cihazdan kartı çeker, sonra tıklar. "card_manual" hariç normal
        offline metodlar için action_mark_paid_offline çağrılır.
        """
        order = request.env["hashtap.order"].sudo().browse(order_id).exists()
        if not order:
            return {"error": "order_not_found"}
        if order.payment_state == "paid":
            return {"order": _serialize_order(order), "already_paid": True}
        order.payment_method_code = method_code or "cash"
        order.action_mark_paid_offline()
        return {"order": _serialize_order(order)}
