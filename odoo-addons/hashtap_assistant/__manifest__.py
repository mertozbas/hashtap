{
    "name": "HashTap Assistant",
    "version": "17.0.1.0.0",
    "category": "Tools",
    "summary": "HashTap CEO — restoran sahibi için AI asistan kullanıcısı + Discuss kanalı",
    "description": """
HashTap Assistant
=================
CEO adında bir res.users + res.partner oluşturur. Bu kullanıcı
apps/ai-bot Python sidecar tarafından login olarak kullanılır;
patron Discuss DM kanalında CEO ile konuşur.

Detay: docs/AI_ASSISTANT.md, docs/ceo-ai/.
""",
    "author": "HashTap",
    "license": "LGPL-3",
    "depends": ["base", "mail", "discuss"],
    "data": [
        "security/ir.model.access.csv",
        "data/ceo_user.xml",
    ],
    "installable": True,
    "application": False,
    "auto_install": False,
}
