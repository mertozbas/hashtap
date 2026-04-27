"""Telegram kanalı — strands-telegram tool'u kullanılır.

Çalışma şekli: Telegram Bot API long-polling ile inbound mesajları çek;
allowed_chats listesindeki chat ID'lerden gelen mesajları agent'a sok;
yanıtı Telegram'a yolla. Strands tool olarak değil, paralel async görev
olarak işlenir (telegram'da sender = patron, audit ve session ayrı).
"""
from __future__ import annotations

import asyncio
import logging

import httpx

from ..agent_factory import get_agent
from ..config import settings

_logger = logging.getLogger(__name__)

API_BASE = "https://api.telegram.org"


async def _telegram_request(method: str, **params) -> dict:
    if not settings.telegram_bot_token:
        return {}
    url = f"{API_BASE}/bot{settings.telegram_bot_token}/{method}"
    async with httpx.AsyncClient(timeout=35.0) as client:
        r = await client.post(url, json=params)
        r.raise_for_status()
        return r.json()


async def _send_message(chat_id: int, text: str) -> None:
    # Telegram 4096 char sınırı — uzun mesajları parçala
    while text:
        chunk = text[:4000]
        text = text[4000:]
        try:
            await _telegram_request(
                "sendMessage",
                chat_id=chat_id,
                text=chunk,
                parse_mode="Markdown",
            )
        except httpx.HTTPError:  # noqa: PERF203
            # Markdown parse hatası ise plain text yolla
            await _telegram_request("sendMessage", chat_id=chat_id, text=chunk)


async def _process_telegram_update(update: dict) -> None:
    msg = update.get("message") or update.get("edited_message")
    if not msg:
        return
    chat = msg.get("chat") or {}
    chat_id = chat.get("id")
    text = (msg.get("text") or "").strip()
    if not chat_id or not text:
        return

    allowed = settings.telegram_allowed_chat_ids
    if allowed and chat_id not in allowed:
        _logger.warning("Telegram: izinsiz chat_id %s ignore edildi", chat_id)
        return

    sender = msg.get("from") or {}
    username = sender.get("username") or f"tg-{sender.get('id', chat_id)}"
    user_key = f"telegram:{username}"

    agent = get_agent(user_key)
    try:
        result = await asyncio.to_thread(agent, text)
        reply = str(result)
    except Exception as e:  # noqa: BLE001
        _logger.exception("Agent telegram cevabı hata verdi")
        reply = f"⚠ Şu an cevap üretemiyorum: {e}"

    await _send_message(chat_id, reply)


async def _telegram_loop() -> None:
    """Long-polling ana döngü."""
    if not settings.telegram_enabled:
        _logger.info("Telegram devre dışı (TELEGRAM_BOT_TOKEN boş).")
        return

    _logger.info("Telegram listener başlıyor.")
    offset = 0
    while True:
        try:
            payload = await _telegram_request(
                "getUpdates",
                offset=offset,
                timeout=30,
                allowed_updates=["message", "edited_message"],
            )
            for upd in payload.get("result", []):
                offset = upd["update_id"] + 1
                await _process_telegram_update(upd)
        except httpx.HTTPError as e:
            _logger.warning("Telegram getUpdates hata: %s — 5 sn sonra tekrar", e)
            await asyncio.sleep(5)
        except Exception:  # noqa: BLE001
            _logger.exception("Telegram loop unexpected, 5 sn sonra tekrar.")
            await asyncio.sleep(5)


def start_telegram_listener() -> list[asyncio.Task]:
    if not settings.telegram_enabled:
        return []
    return [asyncio.create_task(_telegram_loop(), name="telegram-poll")]
