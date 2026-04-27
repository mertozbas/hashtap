# HashTap CEO — AI Asistanı

HashTap'in restoran sahibi için tasarlanmış kişisel AI asistanı. Kod
adı **CEO**. Patron Discuss veya Telegram'dan soru sorar; CEO,
restoranın o anki tüm verisine erişip kısa, net, sayılarla cevap
verir.

> **TL;DR.** Strands Agent + provider-pluggable LLM (Ollama default,
> Claude / GPT / Bedrock seçilebilir). 1 generic + 8 convenience tool
> ile Odoo'ya XML-RPC üzerinden bağlanır. Multi-turn memory + per-user
> session. Discuss kanalı ana arayüz, Telegram opsiyonel.

Son güncelleme: 2026-04-27.

## Niye ayrı bir doküman?

CEO ajan, HashTap'in iş mantığından ayrı yaşayan bir Python
servisi (`apps/ai-bot/`). Doğru çalışması için Strands SDK,
Ollama / API provider, Odoo XML-RPC, Discuss bus.bus ve Telegram
gibi bileşenlerin doğru bağlanması gerek. Ayrı doküman seti
detayları ayrı tutar; ana `OPERATIONS.md` ve `ARCHITECTURE.md`
ana ürün için temiz kalır.

## Klasör haritası

| Doküman | İçerik |
|---|---|
| **bu sayfa** (`AI_ASSISTANT.md`) | Üst düzey özet, navigasyon |
| [`ceo-ai/01-overview.md`](./ceo-ai/01-overview.md) | Konsept, kullanım senaryoları, örnek diyaloglar |
| [`ceo-ai/02-architecture.md`](./ceo-ai/02-architecture.md) | Bileşenler, akış diyagramı, bus.bus, deployment |
| [`ceo-ai/03-tools-catalog.md`](./ceo-ai/03-tools-catalog.md) | 9 tool detayı, parametreler, dönüş şeması, örnekler |
| [`ceo-ai/04-providers.md`](./ceo-ai/04-providers.md) | Ollama / Claude / GPT / Bedrock kurulum, env |
| [`ceo-ai/05-memory-and-sessions.md`](./ceo-ai/05-memory-and-sessions.md) | Strands session manager, sliding window, summarization |
| [`ceo-ai/06-channels-discuss-telegram.md`](./ceo-ai/06-channels-discuss-telegram.md) | Discuss bus.bus + Telegram entegrasyonları |
| [`ceo-ai/07-prompting.md`](./ceo-ai/07-prompting.md) | CEO sistem prompt'u, rapor şablonları, örnek çıktılar |
| [`ceo-ai/08-deployment.md`](./ceo-ai/08-deployment.md) | docker-compose, env, ölçek, monitoring |
| [`ceo-ai/09-roadmap.md`](./ceo-ai/09-roadmap.md) | Faz 1-5 yol haritası |
| [`ceo-ai/adr/0013-ai-bot-architecture.md`](./ceo-ai/adr/0013-ai-bot-architecture.md) | Mimari karar kaydı |
| [`apps/ai-bot/README.md`](../apps/ai-bot/README.md) | Geliştirici hızlı başlangıç |

## Üç soruda kısa özet

**Bu nedir?**
Bir restoran sahibinin "Bugünün cirosu ne?", "En çok satan ürün?",
"A4 masasında ne var?" gibi sorularını anlık cevaplayan AI ajanı.
Restoran verisi üstünde okuma yapar, raporlar, öneriler verir.

**Nasıl çalışır?**
Strands Agent framework + Ollama (varsayılan) veya bulut LLM. Patron
Discuss DM'de yazar → bus.bus WebSocket olayı → CEO mesajı işler →
Odoo'ya XML-RPC ile sorgular → cevabı aynı kanala yazar. Telegram
da paralel kanaldır.

**Neden generic + convenience tool karması?**
Yaygın senaryolar (`bugun_ozeti`, `gun_raporu`) için sabit, hızlı,
formatlı tool'lar var. Ad hoc soru gelince model `use_hashtap`
generic tool'u ile Odoo modeline doğrudan ulaşır. Cloudflare
SDK pattern'i temel alındı (bkz. ADR-0013).

## Şu anki durum

- ✅ Doküman setleri yazılmaya başlandı (bu klasör)
- ⏳ `apps/ai-bot/` Strands sidecar — Faz 1 inşaatta
- ⏳ `odoo-addons/hashtap_assistant/` — bot user + Discuss kanalı
- ⏳ Test: Ollama (gemma4:31b) + Discuss DM ile uçtan uca

Detay: [`ceo-ai/09-roadmap.md`](./ceo-ai/09-roadmap.md).

## Hızlı testler için

1. Ollama lokal koşuyor mu (host): `curl http://localhost:11434/api/tags`
2. Sidecar ayakta mı: `curl http://localhost:4200/health`
3. Discuss DM aç: Yönetici Paneli → Discuss → Direct Messages → CEO
4. Yaz: "merhaba, bugünün özeti?"

CEO Türkçe cevaplar, sayılarla. Detay rapor isteğinde markdown tablo
veya HTML rapor üretir.
