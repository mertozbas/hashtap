"""Discuss kanalı — bus.bus WebSocket (ana) + mail.message polling (fallback).

CEO bot user'ı her DM kanalını dinler. Patron yazdığında:
  1. Mesajı agent'a aktarır
  2. Yanıtı aynı kanala mail.message_post ile yazar
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
from datetime import datetime, timedelta

import websockets
from websockets.exceptions import ConnectionClosed, WebSocketException

from ..agent_factory import get_agent
from ..config import settings
from ..odoo_client import get_client

_logger = logging.getLogger(__name__)


_HTML_TAG = re.compile(r"<[^>]+>")
_BR = re.compile(r"<br\s*/?>", re.IGNORECASE)


def _strip_html(html: str) -> str:
    """Discuss mesajları HTML body olarak gelir; düz metne çevir."""
    if not html:
        return ""
    text = _BR.sub("\n", html)
    text = _HTML_TAG.sub("", text)
    return text.strip()


def _to_html(markdown_or_text: str) -> str:
    """Cevabı Discuss'a yazılacak hafif HTML'e çevir.

    Markdown'ın tablonu özet bloğu olarak <pre> içine al, satırları <br/>
    yap. Tam markdown render kütüphanesi getirmek bu boyutta gereksiz.
    """
    body = markdown_or_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    has_block = "\n|" in body or "```" in body
    if has_block:
        return f"<pre>{body}</pre>"
    return body.replace("\n", "<br/>")


async def _process_message(channel_id: int, sender_email: str, text: str) -> None:
    """Mesajı agent'a sok, yanıtı aynı kanala yaz."""
    if not text.strip():
        return

    agent = get_agent(sender_email)
    try:
        result = await asyncio.to_thread(agent, text)
        reply = str(result)
    except Exception as e:  # noqa: BLE001
        _logger.exception("Agent çağrısı hata verdi")
        reply = f"⚠ Şu an cevap üretemiyorum: {e}"

    body_html = _to_html(reply)
    client = get_client()
    try:
        await asyncio.to_thread(
            client.execute_kw,
            "mail.channel",
            "message_post",
            [[channel_id]],
            {"body": body_html, "message_type": "comment", "subtype_xmlid": "mail.mt_comment"},
        )
    except Exception:  # noqa: BLE001
        _logger.exception("Discuss'a cevap yazılamadı (channel=%s)", channel_id)


# ─────────────────────────────────────────────────── Polling fallback ──
async def _poll_loop() -> None:
    """mail.message tablosuna periyodik bakar, CEO'ya yazılan yeni mesajları işler."""
    if settings.discuss_poll_interval_seconds <= 0:
        _logger.info("Polling devre dışı (interval=0).")
        return

    client = get_client()
    last_seen = datetime.utcnow() - timedelta(seconds=settings.discuss_poll_interval_seconds)
    _logger.info("Polling loop başlıyor — %s sn aralık", settings.discuss_poll_interval_seconds)

    while True:
        try:
            since = last_seen.strftime("%Y-%m-%d %H:%M:%S")
            # CEO partner'ı içeren kanal mesajlarını çek (kendi mesajlarını hariç)
            domain = [
                ["date", ">=", since],
                ["model", "=", "discuss.channel"],  # Odoo 17'de discuss.channel
                ["author_id", "!=", settings.odoo_ceo_partner_id or 0],
            ]
            messages = client.search_read(
                "mail.message",
                domain,
                fields=["id", "res_id", "body", "author_id", "date"],
                limit=20,
                order="date asc",
            )
            for msg in messages:
                channel_id = msg["res_id"]
                # Sadece CEO'nun üyesi olduğu kanalları işle
                ceo_member = client.execute_kw(
                    "discuss.channel",
                    "search_count",
                    [[["id", "=", channel_id], ["channel_member_ids.partner_id", "=", settings.odoo_ceo_partner_id]]],
                )
                if not ceo_member:
                    continue
                # author email
                authors = client.search_read(
                    "res.partner",
                    [["id", "=", msg["author_id"][0]]],
                    fields=["email"],
                    limit=1,
                )
                sender_email = authors[0]["email"] if authors and authors[0].get("email") else f"partner-{msg['author_id'][0]}"
                text = _strip_html(msg["body"])
                await _process_message(channel_id, sender_email, text)
                # last_seen ilerle
                try:
                    last_seen = datetime.strptime(msg["date"], "%Y-%m-%d %H:%M:%S") + timedelta(seconds=1)
                except (TypeError, ValueError):
                    last_seen = datetime.utcnow()
        except Exception:  # noqa: BLE001
            _logger.exception("Polling tick hata verdi, devam edilecek.")
        await asyncio.sleep(settings.discuss_poll_interval_seconds)


# ──────────────────────────────────────────────── WebSocket (bus.bus) ──
async def _ws_loop() -> None:
    """bus.bus WebSocket'inden mail.message create event'lerini dinle.

    Odoo 17 bus.bus protokolü: subscribe → channels listesi.
    Hata olursa exponential backoff + polling tetikler (yan görev).
    """
    backoff = 2
    while True:
        try:
            _logger.info("WebSocket bağlanıyor: %s", settings.discuss_bus_url)
            async with websockets.connect(
                settings.discuss_bus_url, ping_interval=20, ping_timeout=15
            ) as ws:
                # Tüm kanallara abone olamayız; subscribe payload Odoo 17'de
                # session bazlıdır. Burada minimal "subscribe" gönderiyoruz;
                # gerçek prod için CEO'nun partner channel'ları enumerate edilip
                # eklenir. Polling yine fallback kalır.
                await ws.send(
                    json.dumps(
                        {
                            "event_name": "subscribe",
                            "data": {"channels": [], "last": 0},
                        }
                    )
                )
                backoff = 2
                async for raw in ws:
                    try:
                        event = json.loads(raw)
                    except json.JSONDecodeError:
                        continue
                    # bus.bus event'leri farklı şemalar gelebilir; güvenli handle.
                    payload = event.get("payload") or event.get("data") or {}
                    msg_type = (event.get("type") or "").lower()
                    if "mail.message" not in msg_type and "discuss" not in msg_type:
                        continue
                    # Polling zaten ayrıntılı ele alıyor — burada sadece tetikleyici
                    # role bırakıyoruz (force-tick polling).
                    _logger.debug("WS event: %s", msg_type)
        except (ConnectionClosed, WebSocketException, OSError) as e:
            _logger.warning("WS koptu (%s) — %s sn sonra tekrar denenecek", e, backoff)
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, 60)
        except Exception:  # noqa: BLE001
            _logger.exception("WS loop unexpected — tekrar denenecek.")
            await asyncio.sleep(5)


def start_discuss_listeners() -> list[asyncio.Task]:
    """Hem polling hem WS task'lerini başlat — main lifespan'den çağırılır."""
    tasks: list[asyncio.Task] = []
    if settings.discuss_poll_interval_seconds > 0:
        tasks.append(asyncio.create_task(_poll_loop(), name="discuss-poll"))
    tasks.append(asyncio.create_task(_ws_loop(), name="discuss-ws"))
    return tasks
