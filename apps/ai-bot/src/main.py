"""HashTap CEO sidecar — FastAPI + Strands agent + listeners.

Sorumluluklar:
 - /health, /metrics, /chat HTTP endpoint'leri
 - Discuss bus.bus dinleme + polling
 - Telegram long-polling (token varsa)
 - Per-user agent + session yönetimi
"""
from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .agent_factory import get_agent
from .channels.discuss import start_discuss_listeners
from .channels.telegram import start_telegram_listener
from .config import settings

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
_logger = logging.getLogger(__name__)


_background_tasks: list[asyncio.Task] = []


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _logger.info("CEO sidecar starting (provider=%s)", settings.provider)
    _background_tasks.extend(start_discuss_listeners())
    _background_tasks.extend(start_telegram_listener())
    try:
        yield
    finally:
        for t in _background_tasks:
            t.cancel()
        await asyncio.gather(*_background_tasks, return_exceptions=True)
        _logger.info("CEO sidecar shut down.")


app = FastAPI(title="HashTap CEO", version="0.1.0", lifespan=lifespan)


class ChatRequest(BaseModel):
    user_id: str
    message: str


class ChatResponse(BaseModel):
    user_id: str
    response: str


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "provider": settings.provider,
        "model": (
            settings.ollama_model
            if settings.provider == "ollama"
            else settings.anthropic_model
            if settings.provider == "anthropic"
            else settings.openai_model
            if settings.provider == "openai"
            else settings.bedrock_model
        ),
        "telegram": settings.telegram_enabled,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    """Sentetik test endpoint'i — kanal değil de doğrudan REST'ten konuşmak için."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="empty message")
    agent = get_agent(req.user_id)
    try:
        result = await asyncio.to_thread(agent, req.message)
    except Exception as e:  # noqa: BLE001
        _logger.exception("/chat agent error")
        raise HTTPException(status_code=500, detail=str(e)) from e
    return ChatResponse(user_id=req.user_id, response=str(result))


def run() -> None:
    """`hashtap-ai-bot` script entry point."""
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    run()
