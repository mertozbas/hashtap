"""Hassas alan redaksiyon testleri."""
from src.odoo_client import redact


def test_redact_simple_password():
    assert redact({"password": "abc123"}) == {"password": "***"}


def test_redact_nested():
    obj = {
        "name": "Alice",
        "credentials": {"api_key": "secret-xyz", "username": "alice"},
        "metadata": {"token": "tok"},
    }
    out = redact(obj)
    assert out["credentials"]["api_key"] == "***"
    assert out["credentials"]["username"] == "alice"
    assert out["metadata"]["token"] == "***"
    assert out["name"] == "Alice"


def test_redact_list_of_dicts():
    obj = [{"webhook_secret": "s", "url": "x"}, {"foo": "bar"}]
    out = redact(obj)
    assert out[0]["webhook_secret"] == "***"
    assert out[0]["url"] == "x"
    assert out[1]["foo"] == "bar"


def test_redact_passthrough_primitives():
    assert redact("hello") == "hello"
    assert redact(42) == 42
    assert redact(None) is None
