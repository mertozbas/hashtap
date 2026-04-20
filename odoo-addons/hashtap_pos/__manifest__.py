{
    "name": "HashTap POS",
    "version": "17.0.1.0.0",
    "category": "Point of Sale",
    "summary": "QR sipariş, mobil ödeme ve restoran operasyonu için HashTap genişletmesi",
    "description": """
HashTap POS
===========
Odoo 17 üzerine QR menü + mobil ödeme + e-Arşiv akışını ekler.
Detay: docs/MODULE_DESIGN.md
""",
    "author": "HashTap",
    "website": "https://hashtap.co",
    "license": "LGPL-3",
    "depends": [
        "base",
        "web",
        "point_of_sale",
        "pos_restaurant",
        "account",
        "stock",
    ],
    "data": [
        "security/ir.model.access.csv",
        "views/menu_root.xml",
    ],
    "external_dependencies": {
        "python": ["requests"],
    },
    "installable": True,
    "application": True,
    "auto_install": False,
}
