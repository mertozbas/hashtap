"""Per-user session yönetimi — Strands FileSessionManager wrapper."""
from __future__ import annotations

import logging
import re
from pathlib import Path

from strands.session import FileSessionManager

from ..config import settings

_logger = logging.getLogger(__name__)


_SAFE = re.compile(r"[^a-zA-Z0-9._@-]")


def _sanitize_user_id(user: str) -> str:
    """Dosya yolu olarak güvenli user_id üret."""
    return _SAFE.sub("_", user)[:120] or "anonymous"


_managers: dict[str, FileSessionManager] = {}


def get_session_manager(user_id: str) -> FileSessionManager:
    """Bir user için FileSessionManager döner (cache'li)."""
    safe = _sanitize_user_id(user_id)
    if safe in _managers:
        return _managers[safe]
    base = Path(settings.session_dir) / safe
    base.mkdir(parents=True, exist_ok=True)
    mgr = FileSessionManager(session_dir=str(base))
    _managers[safe] = mgr
    _logger.info("Session manager initialized for %s → %s", user_id, base)
    return mgr
