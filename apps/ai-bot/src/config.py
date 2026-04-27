"""Konfigürasyon — .env'den yüklenir, Pydantic ile doğrulanır."""
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Tüm sidecar konfigürasyonu."""

    # Provider
    provider: Literal["ollama", "anthropic", "openai", "bedrock"] = "ollama"

    # Ollama
    ollama_host: str = "http://host.docker.internal:11434"
    ollama_model: str = "gemma4:31b"
    ollama_keep_alive: str = "10m"

    # Anthropic
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    # Bedrock
    aws_region: str = "eu-central-1"
    bedrock_model: str = "anthropic.claude-sonnet-4-6"

    # Odoo
    odoo_url: str = "http://host.docker.internal:8069"
    odoo_db: str = "hashtap"
    odoo_user: str = "ceo@hashtap.local"
    odoo_password: str = ""
    odoo_ceo_partner_id: int = 0

    # Discuss
    discuss_bus_url: str = "ws://host.docker.internal:8072/websocket"
    discuss_poll_interval_seconds: int = 10

    # Telegram
    telegram_bot_token: str = ""
    telegram_allowed_chats: str = ""

    # Agent davranışı
    agent_max_history: int = 20
    agent_summarize_after: int = 50

    # HTTP
    host: str = "0.0.0.0"
    port: int = 4200

    # Logging
    audit_log_path: str = "./sessions/audit.jsonl"
    session_dir: str = "./sessions"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @property
    def telegram_enabled(self) -> bool:
        return bool(self.telegram_bot_token)

    @property
    def telegram_allowed_chat_ids(self) -> list[int]:
        if not self.telegram_allowed_chats:
            return []
        return [int(x.strip()) for x in self.telegram_allowed_chats.split(",") if x.strip()]


settings = Settings()
