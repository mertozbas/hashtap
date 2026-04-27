"""Strands Agent factory — provider switch + tools + memory.

Tek nokta giriş: `build_agent(user_id)` → Agent örneği döner.
"""
from __future__ import annotations

import logging
from pathlib import Path

from strands import Agent
from strands.agent import (
    SlidingWindowConversationManager,
    SummarizingConversationManager,
)

from .config import settings
from .memory import get_session_manager
from .tools import ALL_TOOLS

_logger = logging.getLogger(__name__)


def _load_system_prompt() -> str:
    path = Path(__file__).parent / "prompts" / "ceo_system.md"
    if not path.exists():
        return "Sen HashTap restoranının CEO asistanısın."
    return path.read_text(encoding="utf-8")


def _build_model():
    """Provider .env'den seçilir."""
    p = settings.provider.lower()
    if p == "anthropic":
        from strands.models import AnthropicModel

        if not settings.anthropic_api_key:
            raise RuntimeError("PROVIDER=anthropic ama ANTHROPIC_API_KEY boş.")
        _logger.info("Provider: Anthropic %s", settings.anthropic_model)
        return AnthropicModel(
            model_id=settings.anthropic_model,
            max_tokens=4096,
            client_args={"api_key": settings.anthropic_api_key},
        )

    if p == "openai":
        from strands.models import OpenAIModel

        if not settings.openai_api_key:
            raise RuntimeError("PROVIDER=openai ama OPENAI_API_KEY boş.")
        _logger.info("Provider: OpenAI %s", settings.openai_model)
        return OpenAIModel(
            model_id=settings.openai_model,
            max_tokens=4096,
            client_args={"api_key": settings.openai_api_key},
        )

    if p == "bedrock":
        from strands.models import BedrockModel

        _logger.info("Provider: Bedrock %s @ %s", settings.bedrock_model, settings.aws_region)
        return BedrockModel(model_id=settings.bedrock_model, region_name=settings.aws_region)

    # Default — Ollama
    from strands.models import OllamaModel

    _logger.info("Provider: Ollama %s @ %s", settings.ollama_model, settings.ollama_host)
    return OllamaModel(
        host=settings.ollama_host,
        model_id=settings.ollama_model,
        keep_alive=settings.ollama_keep_alive,
        max_tokens=2048,
    )


def _build_conversation_manager():
    """Sliding window varsayılan; eşik üstü olunca summarize."""
    if settings.agent_summarize_after > settings.agent_max_history:
        # Summarize yalnızca yüksek hacimde devreye girer.
        return SummarizingConversationManager(
            preserve_recent_messages=settings.agent_max_history,
            summary_ratio=0.3,
        )
    return SlidingWindowConversationManager(window_size=settings.agent_max_history)


def build_agent(user_id: str) -> Agent:
    """Bir kullanıcı için Agent yarat (per-user session)."""
    session_mgr = get_session_manager(user_id)
    return Agent(
        model=_build_model(),
        system_prompt=_load_system_prompt(),
        tools=ALL_TOOLS,
        conversation_manager=_build_conversation_manager(),
        session_manager=session_mgr,
    )


# Hot path için cache (kullanıcı başı)
_agents: dict[str, Agent] = {}


def get_agent(user_id: str) -> Agent:
    if user_id not in _agents:
        _agents[user_id] = build_agent(user_id)
    return _agents[user_id]
