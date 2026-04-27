# `apps/ai-bot/` — HashTap CEO

Restoran sahibi için kişisel AI asistanı. Strands Agent + provider-pluggable
LLM (Ollama default) + Odoo XML-RPC tools + Discuss/Telegram kanalları.

> Ana doküman: [`../../docs/AI_ASSISTANT.md`](../../docs/AI_ASSISTANT.md)

## Hızlı başlangıç (geliştirme)

```sh
# 1. Ön koşullar
#   - Python 3.11+
#   - Ollama lokal çalışıyor: `ollama serve`
#   - gemma4:31b modeli kurulu: `ollama pull gemma4:31b`
#   - HashTap (Odoo) ayakta: docker compose -f infra/odoo/docker-compose.yml up -d

# 2. hashtap_assistant Odoo modülünü kur (CEO user oluşur)
docker exec odoo-odoo-1 odoo -d hashtap -i hashtap_assistant \
  --no-http --stop-after-init

# 3. .env hazırla
cd apps/ai-bot
cp .env.example .env
# Düzenle:
#   ODOO_PASSWORD=ceo-bot-password   (modülde tanımlı default)
#   ODOO_CEO_PARTNER_ID=<id>         (Odoo Settings → Users → CEO → partner)

# 4. Bağımlılıklar + çalıştır
pip install -e .
python -m src.main
```

`http://localhost:4200/health` → `{"status":"ok",...}` dönmeli.

## Hızlı test

```sh
# REST endpoint'i (Discuss/Telegram'a gerek yok)
curl -X POST http://localhost:4200/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id": "patron@hashtap.local", "message": "Bugün ne yapıyoruz?"}'
```

## Provider değiştir

`.env` içinde `PROVIDER=` değiştir, restart:

| Provider | Ek config |
|---|---|
| `ollama` (default) | `OLLAMA_HOST`, `OLLAMA_MODEL` |
| `anthropic` | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` |
| `openai` | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| `bedrock` | `AWS_REGION`, `BEDROCK_MODEL` (AWS creds standard) |

## Telegram aktivasyonu

```sh
# 1. @BotFather → /newbot → token al
# 2. .env:
#    TELEGRAM_BOT_TOKEN=123456:ABC...
#    TELEGRAM_ALLOWED_CHATS=<senin chat_id'in>     # /start sonra mesajdan al
# 3. Restart
```

## Docker compose

```sh
# Profile ile başlat (default'ta start etmez)
docker compose -f infra/odoo/docker-compose.yml --profile ai up -d
```

## Yapı

```
apps/ai-bot/
├── pyproject.toml
├── .env.example
├── Dockerfile
├── src/
│   ├── main.py             # FastAPI + lifespan + listeners
│   ├── config.py           # .env Pydantic validation
│   ├── agent_factory.py    # Provider switch + agent yaratıcı
│   ├── odoo_client.py      # XML-RPC client + redaksiyon
│   ├── tools/
│   │   ├── generic.py      # use_hashtap (escape hatch)
│   │   ├── overview.py     # bugun_ozeti, hafta_karsilastirma, peak_saatler
│   │   ├── orders.py       # aktif_siparisler, masa_durumu
│   │   ├── menu_stock.py   # en_cok_satan, dusuk_stok
│   │   └── reports.py      # gun_raporu (markdown)
│   ├── channels/
│   │   ├── discuss.py      # bus.bus WS + polling fallback
│   │   └── telegram.py     # python-telegram-bot long-poll
│   ├── memory/
│   │   └── sessions.py     # FileSessionManager wrapper
│   └── prompts/
│       └── ceo_system.md   # CEO persona + tool kullanım kuralları
├── sessions/               # per-user agent state (gitignored)
└── tests/
```

## Komutlar

| Komut | Ne yapar |
|---|---|
| `python -m src.main` | Geliştirme — Uvicorn ile sidecar |
| `pytest` | Testler |
| `ruff check src` | Lint |

## Sınırlar (Faz 1)

- ✅ Salt okuma (`use_hashtap` whitelist: search, read, search_read, ...)
- ✅ Per-user session (her admin için ayrı history)
- ❌ Veri yazma (sipariş silme, kalem değiştirme — Faz 2)
- ❌ Yetki sistemi (sadece admin user'lar mesaj atabilir; her gelen mesajı hâlâ işliyoruz, audit log tutuluyor)

## Sonraki adımlar

- Detaylı dokümanlar: [`docs/ceo-ai/`](../../docs/ceo-ai/)
- Yol haritası: [`docs/ceo-ai/09-roadmap.md`](../../docs/ceo-ai/09-roadmap.md)
