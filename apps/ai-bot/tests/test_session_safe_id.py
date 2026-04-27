"""Session user_id sanitize testleri."""
from src.memory.sessions import _sanitize_user_id


def test_email_passes_through():
    assert _sanitize_user_id("admin@hashtap.local") == "admin@hashtap.local"


def test_path_traversal_blocked():
    out = _sanitize_user_id("../../etc/passwd")
    assert ".." not in out
    assert "/" not in out
    assert out == "______etc_passwd"


def test_long_id_truncated():
    long = "x" * 500
    out = _sanitize_user_id(long)
    assert len(out) <= 120


def test_telegram_prefix():
    assert _sanitize_user_id("telegram:patron_user") == "telegram_patron_user"


def test_empty_falls_back_to_anonymous():
    assert _sanitize_user_id("") == "anonymous"
    assert _sanitize_user_id("@@@") != ""
