# hashtap_theme

HashTap white-label modülü. Odoo markasını son kullanıcıya gizler.

Tasarım: [../../docs/WHITE_LABEL.md](../../docs/WHITE_LABEL.md).

## İskelet durumu

İlk aşamada yalnızca:

- Browser tab title: "HashTap"
- Login footer: "© HashTap"
- Navbar class hook (`o_hashtap_navbar`) + metin placeholder
- SCSS değişkenleri (renk tokenları)

WHITE_LABEL.md §3'teki 13 override kategorisi sırayla bu modüle eklenir. Logo
dosyası eklendikten sonra `webclient_templates.xml` içindeki favicon/brand
blokları aktifleştirilir.
