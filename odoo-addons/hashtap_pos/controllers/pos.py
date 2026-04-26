"""Cashier / Waiter backend endpoint'leri.

`/hashtap/pos/*` altında, masa yönetimi + sipariş + ödeme + kasa kapanış
operasyonları. Gateway BFF `/v1/pos/*` olarak proxy eder.

Authentication: `ir.config_parameter` `hashtap.pos_token` set edilmişse
Authorization: Bearer <token> başlığı zorunlu. Boşsa yerel ağ kabul (dev).
Gateway, env `HASHTAP_POS_TOKEN` set edilmişse her isteğe başlığı ekler.
"""
import hmac
import logging
from datetime import datetime, time, timedelta

from odoo import http, fields
from odoo.exceptions import AccessDenied
from odoo.http import request

_logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────── helpers ─────────
def _json(payload, status=200):
    return request.make_json_response(payload, status=status)


def _check_token():
    """Token kontrol — boş ise dev modu, set ise Bearer eşleşmeli."""
    icp = request.env["ir.config_parameter"].sudo()
    expected = (icp.get_param("hashtap.pos_token") or "").strip()
    if not expected:
        return  # dev / unconfigured
    header = request.httprequest.headers.get("Authorization") or ""
    if not header.startswith("Bearer "):
        raise AccessDenied("missing bearer token")
    given = header[len("Bearer "):].strip()
    if not hmac.compare_digest(given, expected):
        raise AccessDenied("invalid token")


def _serialize_modifier(mod):
    return {
        "id": mod.id,
        "name": {"tr": mod.name_tr, "en": mod.name_en},
        "price_delta_kurus": int(round(float(mod.price_delta or 0) * 100)),
    }


def _serialize_line(line):
    return {
        "id": line.id,
        "item_id": line.item_id.id,
        "item_name": line.item_name,
        "quantity": line.quantity,
        "unit_price_kurus": line.unit_price_kurus,
        "modifier_total_kurus": line.modifier_total_kurus,
        "subtotal_kurus": line.subtotal_kurus,
        "modifier_ids": line.modifier_ids.ids,
        "modifiers": [_serialize_modifier(m) for m in line.modifier_ids],
        "note": line.note or "",
    }


def _serialize_order(order):
    payments = [
        {
            "id": tx.id,
            "method_code": tx.method_code,
            "state": tx.state,
            "amount_kurus": tx.amount_kurus,
            "created_at": tx.create_date.isoformat() if tx.create_date else None,
        }
        for tx in order.payment_transaction_ids
    ] if "payment_transaction_ids" in order._fields else []
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
        "payments": payments,
    }


def _table_status(table, active_orders_map):
    orders = active_orders_map.get(table.id, [])
    if not orders:
        return "free"
    by_state = {o.state for o in orders}
    if "ready" in by_state:
        return "ready"
    if any(o.payment_state == "paid" and o.state in (
        "placed", "paid", "kitchen_sent",
    ) for o in orders):
        return "open"
    return "occupied"


def _build_order_lines(env, order, items_input):
    """Sepet payload'ından order line'ları oluştur (modifier dahil).

    items_input: [{item_id, quantity, modifier_ids?, note?}]
    """
    Item = env["hashtap.menu.item"].sudo()
    Modifier = env["hashtap.modifier"].sudo()
    Line = env["hashtap.order.line"].sudo()
    for raw in items_input:
        if not isinstance(raw, dict):
            continue
        item_id = raw.get("item_id")
        qty = int(raw.get("quantity") or 1)
        note = (raw.get("note") or "").strip()[:300]
        modifier_ids = raw.get("modifier_ids") or []
        if not isinstance(modifier_ids, list):
            modifier_ids = []
        item = Item.browse(item_id).exists() if isinstance(item_id, int) else None
        if not item:
            continue
        price_kurus = int(round(float(item.product_tmpl_id.list_price or 0) * 100))
        mods = Modifier.browse([m for m in modifier_ids if isinstance(m, int)]).exists()
        # Sipariş anında modifier delta'larını dondur (ileride fiyat değişebilir).
        mod_total_kurus = sum(
            int(round(float(m.price_delta or 0) * 100)) for m in mods
        )
        Line.create({
            "order_id": order.id,
            "item_id": item.id,
            "item_name": item.name_tr,
            "unit_price_kurus": price_kurus,
            "quantity": max(1, min(qty, 20)),
            "modifier_ids": [(6, 0, mods.ids)],
            "modifier_total_kurus": mod_total_kurus,
            "note": note or False,
        })


# ─────────────────────────────────────────────────── controller ──────────
class HashTapPos(http.Controller):
    """Cashier + Waiter için backend API."""

    # ---------------------------------------------------------- Tables ---
    @http.route(
        "/hashtap/pos/tables",
        type="http", auth="public", methods=["GET"], csrf=False,
    )
    def list_tables(self, **_kw):
        _check_token()
        tables = (
            request.env["restaurant.table"]
            .sudo()
            .search([("active", "=", True), ("hashtap_enabled", "=", True)],
                    order="name")
        )

        active_orders = request.env["hashtap.order"].sudo().search([
            ("state", "in",
             ("placed", "paid", "kitchen_sent", "preparing", "ready")),
            ("table_id", "in", tables.ids),
        ])
        by_table = {}
        for o in active_orders:
            by_table.setdefault(o.table_id.id, []).append(o)

        payload = []
        for table in tables:
            orders = by_table.get(table.id, [])
            total = sum(o.total_kurus for o in orders)
            unpaid = sum(o.total_kurus - o.paid_amount_kurus for o in orders)
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
                "unpaid_kurus": unpaid,
            })
        return _json({"tables": payload})

    @http.route(
        "/hashtap/pos/tables/<int:table_id>",
        type="http", auth="public", methods=["GET"], csrf=False,
    )
    def table_detail(self, table_id, **_kw):
        _check_token()
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

    # ---------------------------------------------------------- Orders ---
    @http.route(
        "/hashtap/pos/orders",
        type="http", auth="public", methods=["GET"], csrf=False,
    )
    def list_orders(self, state="active", **_kw):
        _check_token()
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
            request.env["hashtap.order"]
            .sudo()
            .search(domain, order="create_date desc", limit=200)
        )
        return _json({"orders": [_serialize_order(o) for o in orders]})

    @http.route(
        "/hashtap/pos/orders/<int:order_id>",
        type="http", auth="public", methods=["GET"], csrf=False,
    )
    def order_detail(self, order_id, **_kw):
        _check_token()
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

        Yerel ağda kasa operatörü güvenilir sayılır; auth token üstten gelir.
        Kasa siparişlerinde require_receipt varsayılanı False.
        """
        _check_token()
        items = items or []
        if not isinstance(table_id, int):
            return {"error": "bad_table"}
        if not isinstance(items, list) or not items:
            return {"error": "empty_cart"}

        table = request.env["restaurant.table"].sudo().browse(table_id).exists()
        if not table:
            return {"error": "table_not_found"}

        Order = request.env["hashtap.order"].sudo()
        order = Order.create({
            "table_id": table.id,
            "state": "placed",
            "payment_state": "unpaid",
            "require_receipt": bool(require_receipt),
            "customer_note": (customer_note or "").strip()[:500] or False,
        })
        _build_order_lines(request.env, order, items)
        return {"order": _serialize_order(order)}

    @http.route(
        "/hashtap/pos/orders/<int:order_id>/lines",
        type="json", auth="public", methods=["POST"], csrf=False,
    )
    def add_lines(self, order_id, items=None, **_kw):
        """Var olan siparişe kalem ekle (cashier "ekle" akışı)."""
        _check_token()
        order = request.env["hashtap.order"].sudo().browse(order_id).exists()
        if not order:
            return {"error": "order_not_found"}
        if order.state in ("served", "cancelled"):
            return {"error": "order_closed"}
        if order.payment_state == "paid":
            return {"error": "already_paid"}
        items = items or []
        if not isinstance(items, list) or not items:
            return {"error": "empty"}
        _build_order_lines(request.env, order, items)
        return {"order": _serialize_order(order)}

    @http.route(
        "/hashtap/pos/orders/<int:order_id>/lines/<int:line_id>",
        type="json", auth="public", methods=["POST"], csrf=False,
    )
    def update_line(self, order_id, line_id, quantity=None, note=None,
                    delete=False, **_kw):
        """Bir kalemin adetini değiştir, notunu güncelle veya sil."""
        _check_token()
        line = request.env["hashtap.order.line"].sudo().browse(line_id).exists()
        if not line or line.order_id.id != order_id:
            return {"error": "line_not_found"}
        order = line.order_id
        if order.payment_state == "paid":
            return {"error": "already_paid"}
        if order.state == "served":
            return {"error": "order_closed"}

        if delete:
            line.unlink()
        else:
            vals = {}
            if isinstance(quantity, int) and quantity > 0:
                vals["quantity"] = max(1, min(quantity, 20))
            if note is not None:
                vals["note"] = (note or "").strip()[:300] or False
            if vals:
                line.write(vals)
        order.invalidate_recordset()
        return {"order": _serialize_order(order)}

    # ---------------------------------------------- State Transitions ---
    @http.route(
        "/hashtap/pos/orders/<int:order_id>/fire",
        type="json", auth="public", methods=["POST"], csrf=False,
    )
    def fire_kitchen(self, order_id, **_kw):
        _check_token()
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
        _check_token()
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
        _check_token()
        order = request.env["hashtap.order"].sudo().browse(order_id).exists()
        if not order:
            return {"error": "order_not_found"}
        order.action_cancel()
        return {"order": _serialize_order(order)}

    # ---------------------------------------------------------- Payment ---
    @http.route(
        "/hashtap/pos/orders/<int:order_id>/pay",
        type="json", auth="public", methods=["POST"], csrf=False,
    )
    def pay_offline(self, order_id, method_code="cash", amount_kurus=None,
                    **_kw):
        """Kasada nakit / kart (sanalpos dışı) ödeme al.

        method_code: "cash" | "pay_at_counter" | "card_manual"
        amount_kurus belirtildiyse partial payment — birden çok pay
        çağrısı sonra `total_kurus`'a ulaşırsa otomatik kapanır.
        Belirtilmediyse tam tutar ödendi varsayılır (geri uyumlu).
        """
        _check_token()
        order = request.env["hashtap.order"].sudo().browse(order_id).exists()
        if not order:
            return {"error": "order_not_found"}
        if order.payment_state == "paid":
            return {"order": _serialize_order(order), "already_paid": True}

        full_amount = order.total_kurus
        try:
            partial = (
                int(amount_kurus)
                if amount_kurus is not None and str(amount_kurus).strip()
                else None
            )
        except (ValueError, TypeError):
            return {"error": "bad_amount"}

        if partial is None or partial >= (full_amount - order.paid_amount_kurus):
            order.payment_method_code = method_code or "cash"
            order.action_mark_paid_offline()
            return {"order": _serialize_order(order)}

        # Partial payment — biriktir, henüz "paid" yapma
        if partial <= 0:
            return {"error": "bad_amount"}
        order.write({
            "paid_amount_kurus": order.paid_amount_kurus + partial,
            "payment_method_code": method_code or "cash",
            "payment_state": "pending",
        })
        order.message_post(
            body=f"Kısmi ödeme alındı: {partial / 100:.2f} TL ({method_code})"
        )
        return {"order": _serialize_order(order), "partial": True}

    @http.route(
        "/hashtap/pos/orders/<int:order_id>/split",
        type="json", auth="public", methods=["POST"], csrf=False,
    )
    def split_bill(self, order_id, splits=None, **_kw):
        """Hesabı böl + her parçaya farklı ödeme metodu uygula.

        splits: [{"amount_kurus": int, "method_code": "cash" | ...}]
        Toplam = order.total_kurus olmalı. Hepsi alındıktan sonra
        action_mark_paid_offline çağrılır (sipariş 'paid' olur).
        """
        _check_token()
        order = request.env["hashtap.order"].sudo().browse(order_id).exists()
        if not order:
            return {"error": "order_not_found"}
        if order.payment_state == "paid":
            return {"order": _serialize_order(order), "already_paid": True}

        splits = splits or []
        if not isinstance(splits, list) or not splits:
            return {"error": "empty_splits"}

        total = 0
        for s in splits:
            if not isinstance(s, dict):
                return {"error": "bad_split"}
            try:
                amt = int(s.get("amount_kurus"))
            except (ValueError, TypeError):
                return {"error": "bad_amount"}
            if amt <= 0:
                return {"error": "bad_amount"}
            total += amt

        remaining = order.total_kurus - order.paid_amount_kurus
        if total != remaining:
            return {
                "error": "split_mismatch",
                "expected_kurus": remaining,
                "given_kurus": total,
            }

        # Apply splits — son ödemede order.payment_method_code'a en
        # büyük tutarın metodunu yaz (raporda dominant method).
        order.paid_amount_kurus = order.paid_amount_kurus + total
        biggest = max(splits, key=lambda x: int(x.get("amount_kurus")))
        order.payment_method_code = biggest.get("method_code") or "cash"

        for s in splits:
            order.message_post(
                body=(
                    f"Bölünmüş ödeme: {int(s['amount_kurus']) / 100:.2f} TL "
                    f"({s.get('method_code')})"
                )
            )

        order.action_mark_paid_offline()
        return {"order": _serialize_order(order)}

    # ------------------------------------------------ Day Close / Z ------
    @http.route(
        "/hashtap/pos/day/summary",
        type="http", auth="public", methods=["GET"], csrf=False,
    )
    def day_summary(self, day=None, **_kw):
        """Gün sonu özeti — Z raporu öncesi ekran.

        day: 'YYYY-MM-DD' (default bugün, restoran lokal saati)
        """
        _check_token()
        target = day or fields.Date.context_today(request.env.user).isoformat()
        try:
            d = datetime.strptime(target, "%Y-%m-%d").date()
        except ValueError:
            return _json({"error": "bad_date"}, status=400)

        start = datetime.combine(d, time.min)
        end = start + timedelta(days=1)

        orders = request.env["hashtap.order"].sudo().search([
            ("create_date", ">=", start),
            ("create_date", "<", end),
            ("state", "!=", "cancelled"),
        ])

        by_method = {}
        for o in orders:
            method = o.payment_method_code or "unknown"
            entry = by_method.setdefault(method, {
                "method_code": method,
                "order_count": 0,
                "total_kurus": 0,
            })
            entry["order_count"] += 1
            entry["total_kurus"] += o.paid_amount_kurus

        paid_orders = [o for o in orders if o.payment_state == "paid"]
        return _json({
            "day": target,
            "totals": {
                "order_count": len(orders),
                "paid_count": len(paid_orders),
                "open_count": len(orders) - len(paid_orders),
                "gross_kurus": sum(o.total_kurus for o in orders),
                "collected_kurus": sum(o.paid_amount_kurus for o in orders),
                "unpaid_kurus": sum(
                    o.total_kurus - o.paid_amount_kurus
                    for o in orders if o.payment_state != "paid"
                ),
            },
            "by_method": list(by_method.values()),
        })

    @http.route(
        "/hashtap/pos/day/close",
        type="json", auth="public", methods=["POST"], csrf=False,
    )
    def day_close(self, day=None, cash_counted_kurus=None, note="", **_kw):
        """Gün kapat — bugünün tüm ödenmemiş açık siparişlerini 'served'
        ya da 'cancelled' duruma sürüklemeden önce raporu dondurur.

        Bu MVP versiyonu yalnızca özet üretir + ir.attachment'a Z
        raporunu PDF/JSON olarak iliştirir. Gerçek kasa kapanışında
        uyumsuzluk (fiziksel sayım vs sistem) ek not olarak girilir.
        """
        _check_token()
        target = day or fields.Date.context_today(request.env.user).isoformat()
        try:
            d = datetime.strptime(target, "%Y-%m-%d").date()
        except ValueError:
            return {"error": "bad_date"}

        start = datetime.combine(d, time.min)
        end = start + timedelta(days=1)

        orders = request.env["hashtap.order"].sudo().search([
            ("create_date", ">=", start),
            ("create_date", "<", end),
        ])

        # Z raporu mesajı + activity (basit MVP — ir.attachment yok)
        cash_total_kurus = sum(
            o.paid_amount_kurus for o in orders
            if o.payment_method_code == "cash" and o.payment_state == "paid"
        )

        diff_kurus = None
        if cash_counted_kurus is not None:
            try:
                diff_kurus = int(cash_counted_kurus) - cash_total_kurus
            except (ValueError, TypeError):
                return {"error": "bad_cash_count"}

        ZReport = request.env["hashtap.day.close"].sudo()
        z = ZReport.create({
            "day": d,
            "order_count": len(orders),
            "gross_kurus": sum(o.total_kurus for o in orders),
            "collected_kurus": sum(o.paid_amount_kurus for o in orders),
            "cash_system_kurus": cash_total_kurus,
            "cash_counted_kurus": cash_counted_kurus or 0,
            "diff_kurus": diff_kurus or 0,
            "note": (note or "")[:1000],
        })

        return {"z_report_id": z.id, "diff_kurus": diff_kurus}

    @http.route(
        "/hashtap/pos/day/closures",
        type="http", auth="public", methods=["GET"], csrf=False,
    )
    def day_closures(self, **_kw):
        _check_token()
        ZReport = request.env["hashtap.day.close"].sudo()
        rows = ZReport.search([], order="day desc, id desc", limit=60)
        return _json({
            "closures": [
                {
                    "id": z.id,
                    "day": z.day.isoformat() if z.day else None,
                    "order_count": z.order_count,
                    "gross_kurus": z.gross_kurus,
                    "collected_kurus": z.collected_kurus,
                    "cash_system_kurus": z.cash_system_kurus,
                    "cash_counted_kurus": z.cash_counted_kurus,
                    "diff_kurus": z.diff_kurus,
                    "note": z.note or "",
                    "closed_at": (
                        z.create_date.isoformat() if z.create_date else None
                    ),
                }
                for z in rows
            ],
        })
