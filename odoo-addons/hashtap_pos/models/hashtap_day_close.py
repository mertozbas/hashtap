"""Z raporu (gün kapanışı).

Her gün sonu kasa kapanışı tek bir kayıt olarak burada tutulur. Sayım
uyumsuzluğu (fiziksel kasa - sistem) `diff_kurus` ile saklanır; pozitif
sayım fazlası, negatif eksik anlamına gelir.

Mali (vergi) raporlama için ayrı bir akış değildir; yalnızca operatörün
gün sonu izini bırakır. Asıl muhasebe `account.move` (faturalar) üzerinden
yürür.
"""
from odoo import api, fields, models


class HashtapDayClose(models.Model):
    _name = "hashtap.day.close"
    _description = "HashTap Z Raporu (Gün Sonu)"
    _order = "day desc, id desc"

    name = fields.Char(
        string="Referans", compute="_compute_name", store=True,
    )
    day = fields.Date(string="Gün", required=True, index=True)
    order_count = fields.Integer(string="Sipariş")
    gross_kurus = fields.Integer(string="Brüt Ciro (kuruş)")
    collected_kurus = fields.Integer(string="Tahsil Edilen (kuruş)")
    cash_system_kurus = fields.Integer(string="Sistem Nakit (kuruş)")
    cash_counted_kurus = fields.Integer(string="Sayım Nakit (kuruş)")
    diff_kurus = fields.Integer(
        string="Sayım Farkı (kuruş)",
        help="Pozitif: sayım fazlası. Negatif: kasa eksik.",
    )
    gross = fields.Monetary(
        string="Brüt Ciro", compute="_compute_money_view",
        currency_field="currency_id",
    )
    collected = fields.Monetary(
        string="Tahsilat", compute="_compute_money_view",
        currency_field="currency_id",
    )
    cash_diff = fields.Monetary(
        string="Sayım Farkı", compute="_compute_money_view",
        currency_field="currency_id",
    )
    currency_id = fields.Many2one(
        "res.currency",
        compute="_compute_currency",
        store=True,
    )
    note = fields.Text(string="Not")
    company_id = fields.Many2one(
        "res.company",
        default=lambda self: self.env.company,
        required=True,
    )

    _sql_constraints = [
        (
            "unique_day_per_company",
            "unique(day, company_id)",
            "Bir gün için tek Z raporu olur.",
        ),
    ]

    @api.depends("day")
    def _compute_name(self):
        for rec in self:
            rec.name = f"Z-{rec.day.isoformat()}" if rec.day else "Z-?"

    @api.depends("company_id")
    def _compute_currency(self):
        for rec in self:
            rec.currency_id = rec.company_id.currency_id

    @api.depends("gross_kurus", "collected_kurus", "diff_kurus")
    def _compute_money_view(self):
        for rec in self:
            rec.gross = rec.gross_kurus / 100.0
            rec.collected = rec.collected_kurus / 100.0
            rec.cash_diff = rec.diff_kurus / 100.0
