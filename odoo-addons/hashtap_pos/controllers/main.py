import logging

from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class HashTapPublic(http.Controller):
    """Public endpoints called by the gateway on behalf of the customer PWA.

    All routes are JSON-in / JSON-out. Rate limiting, CORS and token
    verification happen at the gateway layer; this controller trusts the
    gateway and focuses on business logic.
    """

    @http.route(
        "/hashtap/health",
        type="http",
        auth="public",
        methods=["GET"],
        csrf=False,
    )
    def health(self):
        return request.make_json_response({"status": "ok", "module": "hashtap_pos"})
