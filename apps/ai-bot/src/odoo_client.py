"""Odoo XML-RPC istemcisi — CEO ajan kendi CEO user'ı ile bağlanır."""
from __future__ import annotations

import logging
import xmlrpc.client
from functools import cached_property
from typing import Any

from .config import settings

_logger = logging.getLogger(__name__)


# Generic tool için izin verilen okuma metodları (Faz 1).
READ_ONLY_METHODS = {
    "search",
    "search_read",
    "read",
    "name_get",
    "name_search",
    "fields_get",
    "search_count",
    "default_get",
}

# Hassas alanlar — tool çıktılarında redacte edilir.
SENSITIVE_FIELDS = {
    "password",
    "api_key",
    "api_secret",
    "secret",
    "token",
    "webhook_secret",
    "callback_token",
    "iyzico_api_key",
    "iyzico_secret_key",
    "card_number",
    "card_cvv",
}


class OdooClient:
    """Hafif XML-RPC sarıcı — login + execute_kw + redaksiyon."""

    def __init__(
        self,
        url: str | None = None,
        db: str | None = None,
        user: str | None = None,
        password: str | None = None,
    ) -> None:
        self.url = (url or settings.odoo_url).rstrip("/")
        self.db = db or settings.odoo_db
        self.user = user or settings.odoo_user
        self.password = password or settings.odoo_password

    @cached_property
    def _common(self):
        return xmlrpc.client.ServerProxy(f"{self.url}/xmlrpc/2/common", allow_none=True)

    @cached_property
    def _models(self):
        return xmlrpc.client.ServerProxy(f"{self.url}/xmlrpc/2/object", allow_none=True)

    @cached_property
    def uid(self) -> int:
        uid = self._common.authenticate(self.db, self.user, self.password, {})
        if not uid:
            raise RuntimeError(
                f"Odoo authenticate failed for {self.user}@{self.db}"
            )
        return uid

    def execute_kw(
        self,
        model: str,
        method: str,
        args: list | None = None,
        kwargs: dict | None = None,
    ) -> Any:
        args = args or []
        kwargs = kwargs or {}
        return self._models.execute_kw(
            self.db, self.uid, self.password, model, method, args, kwargs
        )

    def search_read(
        self,
        model: str,
        domain: list,
        fields: list[str] | None = None,
        limit: int | None = None,
        order: str | None = None,
        offset: int = 0,
    ) -> list[dict]:
        kwargs: dict = {"offset": offset}
        if fields:
            kwargs["fields"] = fields
        if limit is not None:
            kwargs["limit"] = limit
        if order:
            kwargs["order"] = order
        return self.execute_kw(model, "search_read", [domain], kwargs)

    def read(self, model: str, ids: list[int], fields: list[str] | None = None) -> list[dict]:
        kwargs: dict = {}
        if fields:
            kwargs["fields"] = fields
        return self.execute_kw(model, "read", [ids], kwargs)

    def list_models(self, prefix: str = "hashtap") -> list[str]:
        """Sadece HashTap-related modelleri listele (discovery için)."""
        rows = self.search_read(
            "ir.model",
            [["model", "=like", f"{prefix}%"]],
            fields=["model", "name"],
            order="model",
            limit=200,
        )
        return [r["model"] for r in rows]

    def model_method_signatures(self, model: str) -> list[str]:
        """Bir modelin public metod listesi (model.execute_kw ile çağrılabilenler)."""
        # Basit yaklaşım: standart CRUD + kullanıcı tanımlı metodlar.
        # Odoo gerçek API metod listesi sunmaz; en azından standartları döner.
        return sorted(
            list(READ_ONLY_METHODS)
            + ["create", "write", "unlink"]  # Faz 1'de kapalı, dökümün için listele
        )


def redact(obj: Any) -> Any:
    """Hassas alanları '***' ile değiştir (recursive)."""
    if isinstance(obj, dict):
        return {
            k: ("***" if str(k).lower() in SENSITIVE_FIELDS else redact(v))
            for k, v in obj.items()
        }
    if isinstance(obj, list):
        return [redact(x) for x in obj]
    return obj


# Tek bir global client (tek-kiracılı). Test override için inject edilebilir.
_client: OdooClient | None = None


def get_client() -> OdooClient:
    global _client
    if _client is None:
        _client = OdooClient()
    return _client
