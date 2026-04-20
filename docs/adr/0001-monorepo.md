# ADR-0001 — Monorepo (npm workspaces)

- Durum: kabul (revize edildi 2026-04-20 — Odoo-tabanlı mimariye uyum)
- Tarih: 2026-04-20

> **Revizyon notu:** ADR-0004 ile Odoo-tabanlı mimariye geçildi. TS tarafındaki uygulama sayısı 4'ten 2'ye düştü (customer-pwa + gateway api). Kalan iki TS uygulaması için monorepo kararı hâlâ geçerli — paylaşılan `packages/shared` tipleri ve `packages/pos-adapters` Segment B için kullanılıyor. `odoo-addons/` dizini aynı repoda ama npm workspaces kapsamı dışında.

## Bağlam

HashTap başlangıçta birbirine sıkı bağlı 4 TS uygulamadan oluşacaktı: müşteri PWA'sı, restoran paneli, API, print-bridge. Bu uygulamalar aynı sipariş/menü/ödeme tiplerini paylaşıyor. Ayrı reposlarda geliştirmek her tip değişikliğinde dört ayrı PR zinciri demek — küçük ekipte pahalı.

## Seçenekler

1. **Çoklu repo + yayımlanmış npm paketleri** — güçlü izolasyon, ama tip sürüm yönetimi faz 0'da gereksiz yük.
2. **pnpm workspaces** — disk/kurulum hızlı, ama toolchain'de ek bağımlılık.
3. **npm workspaces** — Node 20 ile varsayılan, ek araç gerektirmez.
4. **Nx / Turborepo** — build orchestration güçlü, ama 4 uygulama için overkill.

## Karar

**npm workspaces.** Repo kökü `workspaces: ["apps/*", "packages/*"]`. Paylaşılan tipler `packages/shared` altında; `@hashtap/*` path alias'ları `tsconfig.base.json`'da tanımlı.

## Sonuç

- `+` Tek `npm install`; paketler arası canlı tip referansı.
- `+` Sıfır ek toolchain.
- `−` Build cache'i yok; proje büyürse Turborepo'ya geçiş değerlendirilecek.
- `−` npm workspaces bazı edge case'lerde (peer dep çözümü) pnpm kadar akıcı değil; pratikte bu projede karşılaşılmadı.
