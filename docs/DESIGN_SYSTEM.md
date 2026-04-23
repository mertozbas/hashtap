# HashTap — Tasarım Sistemi

Bu doküman HashTap'in tüm müşteri-yüzlü uygulamalarının (Cashier, Waiter,
KDS, Customer PWA) paylaştığı görsel ve etkileşim dilini tanımlar.
Klasik "corporate dashboard" estetiğinden özellikle kaçınıyoruz —
ürünümüz modern, cesur, dokunmatik-birinci ve akışkan hissetmelidir.

Hedef kitle: frontend ekibi, tasarım kararları veren herkes.

**Not:** Bu sistem **müşteri-yüzlü uygulamalar** içindir. Odoo'nun
backoffice paneli bu sistemden ayrı yaşar (sadece `hashtap_theme`
SCSS'iyle marka giydirilir; OWL framework'ü ayrı yaşar — ADR-0009).

Son güncelleme: 2026-04-23.

İlgili:
- `apps/CASHIER.md` — kasa uygulaması şartnamesi
- `apps/WAITER.md` — garson uygulaması şartnamesi
- `KDS.md` — mutfak ekranı (mevcut)

## 1. Tasarım prensipleri

### 1.1 Dark-first

Restoranlar hem aydınlık salon hem karanlık mutfak hem gece vardiyasını
içerir. Dark mode varsayılandır; bu:
- Gözü yormaz (yoğun saatlerde 8+ saat bakılacak ekran).
- Mutfakta yansıma yapmaz.
- Modern görünür (banal Material tablolardan farklılaşır).
- OLED ekranlarda pil tasarrufu (tabletler için plus).

Light mode mevcut ama opsiyonel (kullanıcı ayarı, sistem teması takibi).

### 1.2 Cam / ışık (glassmorphism, controlled)

Ana yüzeyler koyu gradient arkaplan üzerinde **buzlu cam** katmanlar
gibi durur:
- `backdrop-filter: blur(20px)` + yarı-şeffaf arka plan (8-12% beyaz).
- İnce, parlak kenar çizgileri (1px white/10-20%).
- Derin gölgeler yerine **içeriden dışarı** ışık hissi.

**Dikkat:** Aşırıya kaçmaz. Modal, kart, panel gibi ana yüzeylerde
glass — buton ve small element'lerde kompak gölge yeter. Her şeyi cam
yapmak okunabilirliği bozar.

### 1.3 Dokunmatik birinci

- **Minimum dokunma hedefi: 56×56 px.** Ana aksiyon butonları 72×72 px.
- Parmak erişim bölgesi: alt yarı ekran birincil, üst kısım ikincil.
- Hover state'lere güvenme — dokunma event'leri için state tasarla.
- Long-press + swipe hareketleri destekle (Cashier'da masa transferi
  için swipe, Waiter'da adisyon kapatma için long-press vb.).

### 1.4 Hareket (motion)

Her şey **yumuşak** hissettirmelidir:
- Sayfa geçişleri: spring physics (overshoot yok, damping 0.8).
- Kart ekleme/çıkarma: fade + slide (200-300ms).
- Real-time güncellemeler: pulse animasyonu (yeni sipariş KDS'e düşünce
  2× pulse).
- Bildirim: bounce-in (450ms).
- **Kural:** 60fps'ten düşmez. 3-5 yıllık tabletlerde test et.
- **Respect `prefers-reduced-motion`:** varsa tüm animasyonlar instant.

Kütüphane: **Framer Motion** (React). Kendi animasyonumuzu yazmak yerine
standart API'yi kullan.

### 1.5 Canlılık (realtime feel)

Restoran uygulamaları canlıdır. UI her zaman güncel olmalıdır:
- Polling değil WebSocket kullan (Odoo'nun `bus.bus` veya kendi
  SSE'miz).
- "Yeni sipariş geldi" gibi durumlar görsel + işitsel + haptik (mobil).
- Aktif state'ler için pulsing dot (canlı yayın tarzı).
- Veri yükleniyorken skeleton ekran (spinner değil — placeholder
  blokları).

### 1.6 Minimalizm + cesaret

- Az renk, büyük tipografi, çok boşluk.
- Her ekranda **bir** birincil aksiyon bariz olmalı.
- Küçük yazıya kaçma — 13px altında metin zor okunur dokunmatik
  mesafeden.
- Button'lar metin değil, action'dır — "Siparişi Onayla" değil, sadece
  "Onayla" + icon.

### 1.7 Türkiye restoran tonu

- Sıcak ama profesyonel.
- Türkçe copy'de resmi ama samimi (siz-sen karışımı değil, "siz" ama
  direkt).
- Kategori isimleri vb. restoranın kullandığı ifadeleri koru
  ("Köfte" değil "Ev Yapımı Dana Köfte" şeklinde uzun isimlere hazır).

## 2. Renk paleti

### 2.1 Ana paleti (dark)

```css
/* Arka plan katmanları */
--bg-0: #0A0E1A;          /* base — en derin */
--bg-1: #131829;          /* surface — kart arkası */
--bg-2: #1D2338;          /* elevated — modal, dropdown */
--bg-glass: rgba(255, 255, 255, 0.06);  /* cam yüzey */
--bg-glass-strong: rgba(255, 255, 255, 0.10);

/* Arka plan gradient (sayfa body) */
--gradient-page: radial-gradient(
  ellipse at top left,
  #1A2040 0%,
  #0A0E1A 60%
);

/* Kenarlıklar */
--border-subtle: rgba(255, 255, 255, 0.08);
--border-default: rgba(255, 255, 255, 0.14);
--border-strong: rgba(255, 255, 255, 0.22);

/* Metinler */
--text-primary: #F5F6FA;
--text-secondary: #A6ACC0;
--text-muted: #6B7089;
--text-inverse: #0A0E1A;

/* Marka */
--brand-500: #FF6B3D;    /* HashTap turuncu — ana marka */
--brand-400: #FF8A5C;
--brand-600: #E84F1E;
--brand-glow: rgba(255, 107, 61, 0.35);  /* aksent glow */

/* Aksent (tali aksiyonlar) */
--accent-500: #5EEAD4;   /* teal — "hazır" gibi pozitif */
--accent-400: #7BF0DD;

/* State renkleri */
--success: #4ADE80;
--success-bg: rgba(74, 222, 128, 0.12);
--warning: #FBBF24;
--warning-bg: rgba(251, 191, 36, 0.12);
--danger: #F87171;
--danger-bg: rgba(248, 113, 113, 0.12);
--info: #60A5FA;
--info-bg: rgba(96, 165, 250, 0.12);
```

### 2.2 Light mode (opsiyonel)

```css
--bg-0: #FAFBFC;
--bg-1: #FFFFFF;
--bg-2: #F5F6FA;
--bg-glass: rgba(0, 0, 0, 0.03);
--bg-glass-strong: rgba(0, 0, 0, 0.06);

--text-primary: #0A0E1A;
--text-secondary: #4A5069;
--text-muted: #8B90A8;

/* Marka aynı kalır — renk tonu değişmez */
```

### 2.3 Kullanım kuralları

- **Marka turuncu** sadece CTA (primary button), aktif menü, seçili
  öğeler.
- **Aksent teal** "hazır", "başarılı", "tamamlandı" gibi pozitif
  state'lerde.
- **State renkleri** sadece uyarı, bildirim, rozet (badge) için; büyük
  yüzeyler için değil.
- **Gradient'ler** pentagon'larda ve hero/empty state'lerde; yaygın
  kullanma.

## 3. Tipografi

### 3.1 Font ailesi

**Ana font:** [Inter](https://rsms.me/inter/) (variable)
- Neden: neutral, modern, her dilde iyi (Türkçe karakter set tam),
  ücretsiz, variable weight kullanılabilir.

**Yedek font (düşük öncelik):** Satoshi (ücretli), SF Pro (Apple'a özgü).

**Monospace:** JetBrains Mono — fiyat/rakam tablolarında ve teknik
ekranlarda.

```css
@import url('https://rsms.me/inter/inter.css');

:root {
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", "SF Mono", Consolas, monospace;

  /* Feature settings for nicer numbers */
  font-variant-numeric: tabular-nums;
  font-feature-settings: "ss01", "cv11";
}
```

### 3.2 Ölçek

Büyük tipografi dokunmatik uzaktan okunabilirlik için:

```css
--text-xs:   12px;  /* caption, mini label */
--text-sm:   14px;  /* secondary */
--text-base: 16px;  /* body default */
--text-lg:   18px;  /* emphasized body */
--text-xl:   22px;  /* card title */
--text-2xl:  28px;  /* section header */
--text-3xl:  36px;  /* page title, fiyat gösterimi */
--text-4xl:  48px;  /* jumbo — toplamlar, zamanlayıcı */
--text-5xl:  64px;  /* hero — KDS'te büyük masa numarası */

/* Line heights */
--leading-tight: 1.15;
--leading-snug: 1.3;
--leading-normal: 1.5;
--leading-relaxed: 1.7;

/* Weights */
--fw-normal: 400;
--fw-medium: 500;
--fw-semibold: 600;
--fw-bold: 700;
--fw-black: 900;
```

### 3.3 Kullanım

| Eleman | Stil |
|---|---|
| Page title | 3xl, bold, tight leading |
| Section header | 2xl, semibold |
| Card title | xl, semibold |
| Body | base, normal |
| Secondary text | sm, medium, color: text-secondary |
| Captions/labels | xs, medium, uppercase, tracking-wide |
| Prices | lg or 2xl, bold, tabular-nums |
| Button text | lg, semibold |
| Large numeric (toplam vb.) | 4xl or 5xl, black, tabular-nums |

## 4. Layout ve boşluk

### 4.1 Spacing skalası (4px base)

```css
--space-1:   4px;
--space-2:   8px;
--space-3:   12px;
--space-4:   16px;
--space-5:   20px;
--space-6:   24px;
--space-8:   32px;
--space-10:  40px;
--space-12:  48px;
--space-16:  64px;
--space-20:  80px;
--space-24:  96px;
```

Dokunmatik ekranlarda genel olarak **bir üst seviye** kullan: padding
8px değil 16px, margin 16px değil 24px.

### 4.2 Grid / bento layout

Dashboard tipi ekranlarda (Cashier ana ekran, yönetici özet) **Bento
Grid** kullan:
- Eşit olmayan blok boyutları (1×1, 2×1, 2×2, 3×2...)
- 24px gap
- İçerik önem sırasına göre boyutlandırılır (en önemli = en büyük blok)
- Her blok bir glass card; içinde tek bir odaklı bilgi.

### 4.3 Breakpoint'ler

```css
--bp-sm:  640px;   /* small tablet */
--bp-md:  768px;   /* tablet dikey */
--bp-lg:  1024px;  /* tablet yatay, küçük laptop */
--bp-xl:  1280px;  /* kasa ekranı */
--bp-2xl: 1536px;  /* büyük kasa ekranı, KDS */
```

**Hedef cihazlar:**
- Cashier: 15" dokunmatik (1366×768 genelde) — optimize noktası.
- Waiter: 8-10" tablet (800×1280 dikey) — dikey tasarım.
- KDS: 21-27" yatay (1920×1080) — wide tasarım.
- Customer PWA: mobil (iPhone 12+, 390×844 baseline).

## 5. Bileşen kütüphanesi

### 5.1 Kartlar (Glass Card)

```
┌─────────────────────────────────────┐
│ ░░░ buzlu cam zemin ░░░             │
│                                     │
│  [icon]  Başlık              [...] │
│                                     │
│  İçerik metni ya da listesi         │
│                                     │
│  ──────────────────────────────     │
│                                     │
│  [ikincil]      [birincil CTA]      │
└─────────────────────────────────────┘
```

CSS prensipleri:
- `background: var(--bg-glass)`
- `backdrop-filter: blur(20px)`
- `border: 1px solid var(--border-subtle)`
- `border-radius: 20px`
- `padding: 24px`
- Subtle shadow: `0 8px 32px rgba(0, 0, 0, 0.24)`

### 5.2 Butonlar

3 tür + 3 boyut:

**Primary (marka turuncu CTA):**
- Arka plan: `--brand-500`
- Hover: `--brand-400`
- Active: `--brand-600` + içe doğru press
- Glow: `box-shadow: 0 8px 24px var(--brand-glow)`
- Köşe: 14px
- Font: semibold

**Secondary (glass ghost):**
- Arka plan: `--bg-glass`
- Border: `--border-default`
- Hover: `--bg-glass-strong`

**Tertiary (sadece text):**
- Arka plan: transparent
- Renk: `--brand-500`
- Hover: underline

**Boyutlar:**
- `sm`: 40px yüksek, padding 12×16, text-sm
- `md`: 56px yüksek, padding 16×24, text-base (default)
- `lg`: 72px yüksek, padding 20×32, text-lg (**primary actions için**)

**Disabled state:** opacity 0.4, cursor not-allowed.

### 5.3 Form bileşenleri

**Input:**
- Yükseklik: 56px (md), 72px (lg)
- Arka plan: `--bg-glass`
- Border: `--border-default` → focus'ta `--brand-500` + glow
- Padding: 16px
- Label: input'un üstünde 8px boşlukla, text-sm, color secondary

**Select/Dropdown:**
- Custom dropdown (native değil) — modern görünüm için
- Açılınca glass card modal
- Search ile filtreleme desteği

**Toggle / Switch:**
- 48×28px, round
- Off: `--bg-glass-strong`
- On: `--brand-500` + white thumb

**Checkbox / Radio:**
- Custom, 24×24 minimum
- Checked: `--brand-500` arka plan, white check icon

### 5.4 Liste / kart listesi

Yemek menüsü, sipariş listesi gibi yerlerde:
- Her item bir mini glass card.
- Padding 16px, margin-bottom 12px.
- Tıklama alanı tüm card (bağımsız button yok).
- Sağ tarafta chevron icon (ilerleme hissi).
- Long press: quick actions drawer açılsın (iOS style).

### 5.5 Modal / Dialog

- Tam ekran mobile'da, merkezlenmiş dialog tablette.
- Arka plan: `rgba(0,0,0,0.60)` + `backdrop-filter: blur(12px)`
- İçerik: glass card, max-width 600px.
- Enter: scale-in (0.95 → 1) + fade (200ms, spring).
- Exit: scale-out (300ms).
- Kapatma: üst-sağ X ikon (56×56 touch), veya dışarı dokunma.

### 5.6 Toast / Notification

- Sağ-üst veya alt-orta (platform tercih).
- Glass card, 4-6sn sonra otomatik kapanır.
- Icon + title + detay (opsiyonel).
- Swipe to dismiss.
- Stack: birden fazla toast alt alta yığılır.

### 5.7 Tablo (data-heavy ekranlarda)

- Başlık satırı: uppercase, tracking-wide, text-xs, muted color.
- Satır yüksekliği: 56px (dokunma için).
- Alternatif zebra: çok hafif (`rgba(255,255,255,0.02)`).
- Satır hover: `--bg-glass`.
- Sıralanabilir sütun başlıkları: ok ikonu.
- Pagination: alt-orta glass pill.

### 5.8 Badge / Pill

- State göstergeleri: "Yeni", "Ödendi", "Hazırlanıyor".
- Glass pill, border-radius: full.
- Padding: 4px 12px.
- Text-xs, semibold.
- State rengine göre: success-bg + success text.
- Animasyonlu variant: pulsing dot solunda (aktif state'ler için).

### 5.9 Empty state

- Merkeze yaslanmış.
- Büyük ikon (96×96), low opacity (40%).
- Başlık: 2xl, semibold.
- Açıklama: base, color secondary.
- CTA varsa primary button.
- **Asla "no data" yazma** — Türkçe ve samimi: "Henüz sipariş yok. İlk
  QR okunduğunda burada görünecek."

### 5.10 Loading state

**Skeleton:** spinner yerine placeholder blokları.
- Glass card içinde düz şekiller.
- Shimmer animasyonu (soldan sağa gradient).
- Gerçek içerikle aynı layout (CLS yok).

**Progress:** spinner sadece network-pending aksiyonlarda, 1sn+ sürüyorsa.
- Marka turuncu, ince.

### 5.11 Real-time indicator

Canlı bağlantı durumu (KDS'te, Cashier'da):
- Üst-sağ köşe.
- Küçük dot + "Canlı" metni.
- Yeşil pulsing — bağlı.
- Sarı — bağlanıyor.
- Kırmızı — bağlantı kopuk.

## 6. İkonografi

**Kütüphane:** [Lucide Icons](https://lucide.dev) (tüm ikonlar için
tek kaynak).
- Neden: open source, tutarlı, 1300+ ikon, React paketi var.
- Stroke-based (2px), minimal.
- Boyut: 20px (inline), 24px (button), 48px+ (display).

Özel HashTap ikonları (gerekirse):
- Logo SVG (zaten `assets/` altında).
- Markaya özel "HashTap mark" küçük versiyonu.
- QR, masa, yazıcı, mutfak için tema-özel ikonlar (Lucide'dan başla,
  eksik kalan az sayıda custom çiz).

## 7. Hareket ve etkileşim detayı

### 7.1 Geçişler (transitions)

```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-snappy: cubic-bezier(0.16, 1, 0.3, 1);
--ease-bouncy: cubic-bezier(0.34, 1.56, 0.64, 1);

--duration-instant: 100ms;
--duration-fast: 150ms;
--duration-normal: 220ms;
--duration-slow: 320ms;
--duration-leisurely: 500ms;
```

### 7.2 Tipik animasyon eşleşmeleri

| Aksiyon | Süre | Easing |
|---|---|---|
| Button press | 100ms | smooth |
| Modal açılma | 220ms + 100ms overlay | snappy |
| Sayfa geçişi | 320ms | snappy |
| Kart listesi yenileme | 220ms stagger | smooth |
| Toast açılma | 450ms | bouncy |
| Yeni sipariş pulse | 1200ms, 2 tekrar | smooth |
| Layout shift | 220ms | snappy |

### 7.3 Haptik feedback

Mobil cihazlarda (waiter tablet, customer PWA):
- Button press: light impact (`window.navigator.vibrate(8)`)
- Success (sipariş gönderildi): success pattern [10, 40, 10]
- Error: warning pattern [20, 30, 20, 30]
- Dokunmadan-dokunmaya sıkça olan ekranlarda dikkat — abartırsa
  rahatsız eder.

## 8. Erişilebilirlik (a11y)

Restoran ekranları kullanıcıya zorlanmış olsalar bile bazı temel
kuralları gözet:

- **Kontrast:** text/bg ≥ 4.5:1 (WCAG AA). Marka turuncu'nun siyah
  üzerinde 6:1 var.
- **Focus ring:** Tab ile navigate'de görünür olmalı (klavye kullananlar
  için gerekli değil ama monitör debug'ı sırasında helpful).
- **ARIA labels:** Icon-only button'larda `aria-label`.
- **Live regions:** Real-time güncellemelerde screen reader bildirimi
  (ama restoran ekranlarında screen reader pratikte yok — kuralı gözet
  ama abartma).
- **Reduced motion:** `prefers-reduced-motion: reduce` media query'sine
  uy.
- **Dil:** `<html lang="tr">` her zaman; i18n text'ler kullanıcı diline
  göre.

## 9. Dark/Light mode tokens

Design tokens tek yerde (CSS custom property) yönet. Theme switch tek
class değişikliği:

```css
html.theme-dark {
  --bg-0: #0A0E1A;
  --text-primary: #F5F6FA;
  /* ...tüm tokenlar */
}

html.theme-light {
  --bg-0: #FAFBFC;
  --text-primary: #0A0E1A;
  /* ...tüm tokenlar */
}
```

Kullanıcı tercihi localStorage'da; default: `prefers-color-scheme`.

## 10. Teknoloji seçimleri

### 10.1 Frontend framework

**React 18 + TypeScript 5.5+ + Vite** — tüm yeni uygulamalar için.

### 10.2 Stil sistemi

**Tailwind CSS** (config'de HashTap tokens tanımlı) + **kendi
bileşen kütüphanemiz** (packages/ui).

Neden Tailwind:
- Utility-first, hızlı geliştirme.
- PurgeCSS ile küçük bundle.
- Design tokens doğal mapping.

Neden kendi UI paketi:
- Platform ürünlerinde tutarlılık.
- Storybook ile izole geliştirme.
- shadcn/ui yerine custom — daha modern, marka özgün.

### 10.3 State management

- **Zustand** — global state (sepet, kullanıcı, tema).
- **TanStack Query (React Query)** — server state, caching.
- **Context API** — temel shared (i18n, theme).

### 10.4 Animasyon

- **Framer Motion** — sayfa geçişleri, kart animasyonları.
- **react-spring** (ihtiyaç olursa) — fiziksel tabanlı daha karmaşık
  etkileşimler.

### 10.5 Real-time

- **Socket.io** veya native **WebSocket** — Odoo bus.bus'a köprü
  gateway üzerinden.
- Fallback: **Server-Sent Events (SSE)** veya **long-polling**.

### 10.6 Form / validation

- **React Hook Form** — form state.
- **Zod** — şema (packages/shared ile paylaşılan).

### 10.7 Internationalization

- **i18next + react-i18next**.
- Varsayılan TR, opsiyonel EN (customer PWA için; staff app'ler TR).
- Translation dosyaları: `locales/tr.json`, `locales/en.json`.

## 11. Kütüphane yapısı

```
packages/
├── ui/                        # paylaşılan bileşen kütüphanesi
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Toast/
│   │   ├── Badge/
│   │   ├── EmptyState/
│   │   ├── Skeleton/
│   │   └── ...
│   ├── tokens/                # design tokens
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── motion.ts
│   ├── theme/
│   │   ├── dark.ts
│   │   └── light.ts
│   ├── hooks/
│   │   ├── useTheme.ts
│   │   ├── useHaptic.ts
│   │   └── ...
│   └── storybook/
└── shared/                    # zaten var — tipler, zod şemaları
```

Her uygulama `packages/ui`'ı tüketir. Yeni component ihtiyacı
uygulamaya değil kütüphaneye eklenir.

## 12. Tasarım süreç kuralları

1. **Figma kaynak** — tüm tasarım kararları Figma'da (dark mode varyantıyla).
2. **Storybook** — bileşen görsel regresyon testi.
3. **Code = design** — Figma token'lar code token'larla birebir eşleşir.
4. **Design Review** — yeni ekran / büyük değişiklik production'a
   çıkmadan ekip incelemesi.
5. **Kullanıcı testi** — pilot restoranlarda personel gözlemi, mikrointeraksiyon
   geri bildirimi.

## 13. Örnekler / referans estetik

Tasarım tonunu hissetmek için referans alınan ürünler (görsel ilham,
kopyalama değil):

- **Linear** (linear.app) — dark-first, glass, motion, typography
- **Arc Browser** — vibrant gradients, playful
- **Cursor IDE** — modern tooling feel
- **Apple Wallet / Cards** — haptic tactile card stack
- **Stripe Dashboard** — data + glass + clean
- **Notion Calendar** (yeni) — bold typography + subtle motion
- **Toast.com** (POS ABD) — restaurant-native
- **Square POS** — dokunmatik konvansiyonu

**Referans almadığımız:** Bootstrap-admin template'ler, klasik CRM
renkleri (mavi-gri), Odoo'nun native UI'ı.

## 14. Fotoğraf / imagery

- Menü ürün fotoğrafları: kare veya 4:3 oranında, merkez-kırpılmış.
- Empty state illustration'ları: line-art, monokrom (brand color
  accent).
- Loading placeholder'lar: gradient shimmer.
- Ikonlarla fotoğraflar karışık kullanılmaz (ekran ya fotoğraflı ya
  ikonlu; fotoğraflı menü kartı normal, yönetici ekranında ikonlar).

## 15. Açık sorular

- **Haptik motor** waiter tabletinde ne kadar güçlü? — Test et,
  abartırsa kapat.
- **KDS mevcut CSS'ini yeni sisteme uyarla mı?** — Evet, Faz 13 kapsamında;
  ama mevcut functionalty kaybedilmeden incremental.
- **Light mode zorunlu mu?** — MVP'de dark-only acceptable; pilot
  geri bildirimine göre karar.
- **Custom font (Satoshi lisans)?** — Inter yeter, Satoshi faz 2+.
