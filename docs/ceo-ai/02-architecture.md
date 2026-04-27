# 02 — CEO AI Asistanı: Mimari

Son güncelleme: 2026-04-27.

## 1. Üst düzey görünüm

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Patron — iki kanaldan yazabilir:                              │
│                                                                 │
│   ┌─ Discuss DM ──┐                  ┌─ Telegram ──┐           │
│   │  Odoo /web    │                  │  @CEOBot    │           │
│   │  → CEO bot    │                  │  Telegram   │           │
│   │     kullanıcı │                  │  cloud      │           │
│   └────────┬──────┘                  └──────┬──────┘           │
│            │                                 │                  │
│            │ bus.bus WebSocket               │ python-telegram │
│            │ ws://odoo:8072                  │ -bot polling    │
│            │                                 │                  │
│            └────────────┬────────────────────┘                  │
│                         │                                       │
│                         ▼                                       │
│           ┌─────────────────────────┐                           │
│           │    apps/ai-bot          │  Port 4200 (FastAPI)      │
│           │    Strands Agent        │                           │
│           │                         │                           │
│           │  ┌─Provider──────────┐  │                           │
│           │  │ .env: PROVIDER=   │  │                           │
│           │  │   ollama (default)│  │                           │
│           │  │   anthropic       │  │                           │
│           │  │   openai          │  │                           │
│           │  │   bedrock         │  │                           │
│           │  └─────────┬─────────┘  │                           │
│           │            │            │                           │
│           │  ┌─Memory──▼──────────┐ │                           │
│           │  │ FileSessionManager │ │  per-user: sessions/      │
│           │  │ SlidingWindow(20)  │ │   admin@hashtap.com/      │
│           │  └─────────┬──────────┘ │                           │
│           │            │            │                           │
│           │  ┌─Tools───▼──────────┐ │                           │
│           │  │  use_hashtap (1)   │ │  Generic — escape hatch   │
│           │  │  bugun_ozeti (8)   │ │  Convenience — formatlı   │
│           │  └─────────┬──────────┘ │                           │
│           └────────────┼────────────┘                           │
│                        │                                       │
│                        │ XML-RPC                               │
│                        ▼                                       │
│           ┌─────────────────────────┐                           │
│           │   Odoo (HashTap)        │                           │
│           │   Port 8069             │                           │
│           │                         │                           │
│           │  hashtap.order          │                           │
│           │  hashtap.menu.item      │                           │
│           │  restaurant.table       │                           │
│           │  stock.quant            │                           │
│           │  account.move           │                           │
│           │  hashtap.day.close      │                           │
│           │  ...                    │                           │
│           └─────────────────────────┘                           │
│                        ▲                                       │
│                        │ XML-RPC (cevap yazımı)                │
│                        │ res.users (CEO bot user)              │
│                        │ → mail.message create                 │
│                        │   → bus.bus broadcast                 │
│                        │     → patron Discuss'ta görür         │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Bileşenler

### 2.1 `apps/ai-bot/` — Python sidecar

Tek başına çalışan FastAPI servisi. Sorumlulukları:
- Strands `Agent` örneğini yarat (provider, memory, tools)
- Discuss bus.bus WebSocket'inden mesaj dinle
- Telegram polling (eğer `TELEGRAM_BOT_TOKEN` set ise)
- Tool çağrıları için Odoo XML-RPC client tut
- Session'ları diske kaydet (per-user)
- `/health`, `/metrics` HTTP endpointleri

### 2.2 `odoo-addons/hashtap_assistant/` — Odoo modülü

Hafif bir Odoo modülü. Sorumlulukları:
- **CEO** isminde özel bir `res.users` (login: `ceo@hashtap.local`)
- Bu kullanıcı için `mail.channel` (DM tipi) seed data
- Webhook controller (opsiyonel) — `POST /hashtap/ai/inbound`
- Admin panelinde "AI Asistan" linki (Settings)

CEO kullanıcısı **gerçek bir Odoo user**'dır — mesaj yazma yetkisi
olur, mail.thread'a yorum atabilir, vs.

### 2.3 Odoo (mevcut)

Hiçbir core değişiklik yok. CEO ajan zaten var olan modeller üstünde
okuma yapar. `hashtap_assistant` modülü kurulduğunda CEO user'ı +
DM kanalı eklenir; o kadar.

## 3. İletişim akışları

### 3.1 Mesaj gelişi (inbound)

**Discuss DM:**
```
1. Patron Discuss'ta CEO DM'ine yazar
2. Odoo mail.message create event'i tetikler
3. bus.bus channel "mail.channel:<dm_id>" event broadcast eder
4. ai-bot WebSocket aboneliği bu event'i alır
5. Mesaj içeriği + sender_id + channel_id ile agent'a iletilir
```

**Telegram:**
```
1. Patron @CEOBot'a yazar
2. python-telegram-bot polling (4-5 sn) yeni mesajı alır
3. telegram_chat_id → odoo_user mapping ile kim olduğu doğrulanır
4. (sadece admin user'ın chat_id'si tanınır; diğerleri ignored)
5. Mesaj içeriği + sender bilgisi agent'a iletilir
```

### 3.2 Agent işleyişi

```
1. ai-bot inbound mesajı alır
2. session_manager.load(user_email) → geçmiş mesajlar
3. agent(message) → Strands döngüsü:
   a. LLM (Ollama/Claude/...) çağrısı
   b. LLM bir tool çağırırsa (örn. bugun_ozeti)
      → tool fonksiyonu Odoo XML-RPC ile veri çeker
      → sonuç LLM'e geri verilir
   c. LLM nihai yanıtı oluşturur (text)
4. session_manager.save() → diske persist
5. Cevap dönülür
```

### 3.3 Cevap gönderimi (outbound)

**Discuss kanalına yazma:**
```python
# CEO user olarak XML-RPC ile mail.message.message_post
odoo.execute_kw(db, ceo_uid, ceo_pw, "mail.channel", "message_post",
                [channel_id], {"body": response_text, "subtype_xmlid": "mail.mt_comment"})
```
Bu otomatik olarak bus.bus broadcast eder; patron Discuss'ta görür.

**Telegram'a cevap:**
```python
strands_telegram.send_message(chat_id, response_text, parse_mode="Markdown")
```

## 4. Provider switch (.env)

```env
# Hangi LLM kullanılacak
PROVIDER=ollama  # ollama | anthropic | openai | bedrock

# Ollama (varsayılan)
OLLAMA_HOST=http://host.docker.internal:11434
OLLAMA_MODEL=gemma4:31b

# Anthropic (opsiyonel)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6

# OpenAI (opsiyonel)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# AWS Bedrock (opsiyonel)
AWS_REGION=eu-central-1
BEDROCK_MODEL=anthropic.claude-sonnet-4-6
```

`agent_factory.py` içinde basit switch:
```python
if PROVIDER == "anthropic":
    model = AnthropicModel(model_id=ANTHROPIC_MODEL, ...)
elif PROVIDER == "openai":
    model = OpenAIModel(model_id=OPENAI_MODEL, ...)
elif PROVIDER == "bedrock":
    model = BedrockModel(model_id=BEDROCK_MODEL, region=AWS_REGION)
else:  # ollama default
    model = OllamaModel(host=OLLAMA_HOST, model_id=OLLAMA_MODEL)
```

Detay: [`04-providers.md`](./04-providers.md).

## 5. Memory + session katmanı

Strands'in built-in `FileSessionManager` her admin için ayrı dizinde:

```
apps/ai-bot/sessions/
├── admin@hashtap.local/
│   ├── messages.json       # son 20 mesaj (sliding window)
│   ├── summary.txt         # eski mesajların özeti (>50 mesaj sonra)
│   └── metadata.json       # son etkileşim, toplam token, vs.
└── ceo@hashtap.local/      # CEO bot kendisiyle test mesajları
```

Sliding window 20 mesaj, üstü `SummarizingConversationManager`'a
geçince LLM'e özet + son 10 yeni mesaj gönderilir. Token tasarrufu +
multi-turn devamlılık.

Detay: [`05-memory-and-sessions.md`](./05-memory-and-sessions.md).

## 6. Bus.bus WebSocket entegrasyonu

Odoo'nun `bus.bus` modülü built-in WebSocket sunar (port 8072).
Discuss bunun üstüne kurulu. Tüm `mail.message` create event'leri
otomatik broadcast olur.

```python
import websockets
import json

async def listen_discuss(ceo_dm_channels: list[int]):
    uri = f"ws://{ODOO_HOST}:8072/websocket"
    async with websockets.connect(uri) as ws:
        # Bu kanallara abone ol (CEO'nun DM'leri)
        await ws.send(json.dumps({
            "event_name": "subscribe",
            "data": {"channels": [f"mail.channel_{cid}" for cid in ceo_dm_channels]},
        }))
        async for raw in ws:
            event = json.loads(raw)
            if event.get("type") == "mail.message/inbox":
                msg = event["payload"]
                # CEO kendi mesajını ignore et (echo loop önle)
                if msg["author_id"][0] == CEO_PARTNER_ID:
                    continue
                await process_message(msg)
```

**Fallback**: WebSocket bağlantı kopar veya çalışmazsa, ai-bot `mail.message`
search polling'e düşer (10 sn aralık).

Detay: [`06-channels-discuss-telegram.md`](./06-channels-discuss-telegram.md).

## 7. Deployment

Geliştirme:
```sh
# Mac'te direkt
cd apps/ai-bot
uv sync
uv run python -m src.main
```

Prod / Docker:
```yaml
# infra/odoo/docker-compose.yml içinde
services:
  ai-bot:
    build: ../../apps/ai-bot
    env_file: ../../apps/ai-bot/.env
    ports:
      - "4200:4200"
    extra_hosts:
      - "host.docker.internal:host-gateway"  # Linux için
    depends_on:
      odoo:
        condition: service_healthy
    volumes:
      - ai_bot_sessions:/app/sessions
    restart: unless-stopped

volumes:
  ai_bot_sessions:
```

Detay: [`08-deployment.md`](./08-deployment.md).

## 8. Güvenlik kontrol noktaları

| Yer | Kontrol |
|---|---|
| Inbound mesaj | sender_id `base.group_system` üyesi mi? |
| `use_hashtap` tool | metod whitelist (`search`, `read`, `search_read`) |
| XML-RPC client | CEO user kendi kimliği ile bağlanır (admin değil) |
| Tool çıktıları | `_redact()` PII alanları maskele |
| Session dizini | mode 0o600, sadece ai-bot kullanıcısı okur |
| Audit log | `audit.jsonl` her tool çağrısı + sender |

## 9. Hata akışı

```
LLM tool çağrısı  →  tool exception fırlatır  →  Strands @tool decorator
   yakalar  →  {"status": "error", "content": [{"text": str(e)}]} döner  →
LLM gördüğü hatayı yorumlayıp kullanıcıya açıklar
```

Tool retry hook (Strands native):
```python
agent.hooks.add_callback(AfterToolCallEvent, retry_on_transient_error)
```

XML-RPC bağlantı hatası, Odoo timeout, Ollama down — hepsi bu yolla
işlenir. Patron asla "stack trace" görmez; "şu an o veriye erişemiyorum,
biraz sonra tekrar deneyin" gibi insan dostu mesajlar.

## 10. Genişletilebilirlik

Yeni tool eklemek = `tools/` altına yeni `.py` dosyası + `@tool`
decorator. `agent_factory.py` bunu otomatik toplar.

Yeni provider eklemek = `agent_factory.py`'da yeni `if PROVIDER == "..."`
dalı + Strands'in mevcut model class'ı.

Yeni kanal eklemek = `channels/` altına yeni dosya + `start()` /
`process()` arayüzü implementasyonu.

Detay: [`09-roadmap.md`](./09-roadmap.md).
