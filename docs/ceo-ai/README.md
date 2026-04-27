# `docs/ceo-ai/` — CEO AI Asistanı detay dokümanları

Bu klasör HashTap'in CEO AI Asistanı için detaylı iç dokümantasyondur.
Üst doküman: [`../AI_ASSISTANT.md`](../AI_ASSISTANT.md).

## İçerik

| Numara | Doküman | Hedef kitle |
|---|---|---|
| 01 | [Overview](./01-overview.md) | Herkes — konsept, senaryolar |
| 02 | [Architecture](./02-architecture.md) | Geliştirici, ops |
| 03 | [Tools catalog](./03-tools-catalog.md) | Geliştirici |
| 04 | [Providers](./04-providers.md) | Ops, kurulum |
| 05 | [Memory & sessions](./05-memory-and-sessions.md) | Geliştirici |
| 06 | [Channels (Discuss + Telegram)](./06-channels-discuss-telegram.md) | Geliştirici |
| 07 | [Prompting](./07-prompting.md) | Ürün, geliştirici |
| 08 | [Deployment](./08-deployment.md) | Ops |
| 09 | [Roadmap](./09-roadmap.md) | Herkes |
| ADR | [0013 — Architecture](./adr/0013-ai-bot-architecture.md) | Geliştirici |

## Konvansiyon

- Numarasız "ekstra" dokümanlar `XX-` prefix'siz olarak eklenebilir
  (örn. `troubleshooting.md`).
- Her doküman üstte **Son güncelleme** tarihi taşır.
- Kod örnekleri kanonik — eğer kod değişirse doküman da güncellenmeli.
- Bu klasördeki doküman **yalnızca CEO ajan için**; ana ürün
  dokümantasyonu (`docs/ARCHITECTURE.md`, `docs/OPERATIONS.md`,
  `docs/PILOT.md`) burada referanslanır ama duplike edilmez.
