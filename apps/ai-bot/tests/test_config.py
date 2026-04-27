"""Settings yüklenme testleri."""
import os

from src.config import Settings


def test_default_provider_ollama(monkeypatch):
    monkeypatch.delenv("PROVIDER", raising=False)
    s = Settings(_env_file=None)
    assert s.provider == "ollama"
    assert s.ollama_model == "gemma4:31b"


def test_provider_anthropic_via_env(monkeypatch):
    monkeypatch.setenv("PROVIDER", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-test")
    s = Settings(_env_file=None)
    assert s.provider == "anthropic"
    assert s.anthropic_api_key == "sk-test"


def test_telegram_disabled_when_no_token(monkeypatch):
    monkeypatch.delenv("TELEGRAM_BOT_TOKEN", raising=False)
    s = Settings(_env_file=None)
    assert s.telegram_enabled is False
    assert s.telegram_allowed_chat_ids == []


def test_telegram_allowed_chats_csv(monkeypatch):
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "abc")
    monkeypatch.setenv("TELEGRAM_ALLOWED_CHATS", "12345, 67890,")
    s = Settings(_env_file=None)
    assert s.telegram_enabled is True
    assert s.telegram_allowed_chat_ids == [12345, 67890]


def test_invalid_provider_rejected(monkeypatch):
    monkeypatch.setenv("PROVIDER", "openrouter")
    try:
        Settings(_env_file=None)
    except Exception as e:
        assert "openrouter" in str(e) or "Input" in str(e)
    else:
        raise AssertionError("Settings should reject invalid provider")
