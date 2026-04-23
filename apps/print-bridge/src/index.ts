import WebSocket from 'ws';
import pino from 'pino';
import { z } from 'zod';
import { env } from './env.js';
import {
  type KitchenTicket,
  isPrinterReachable,
  printKitchenTicket,
} from './printer.js';
import { PrintQueue, type QueueItem } from './queue.js';

const log = pino({ name: 'print-bridge', level: env.LOG_LEVEL });
const printerOpts = {
  interfaceAddress: env.PRINTER_INTERFACE,
  model: env.PRINTER_MODEL,
};

const kitchenLineSchema = z.object({
  name: z.string(),
  qty: z.number().int().positive(),
  note: z.string().optional(),
});

const kitchenTicketSchema = z.object({
  id: z.string().min(1),
  tableLabel: z.string().min(1),
  createdAt: z.string(),
  lines: z.array(kitchenLineSchema).min(1),
}) satisfies z.ZodType<KitchenTicket>;

const inboundSchema = z.union([
  z.object({ type: z.literal('order.paid'), order: kitchenTicketSchema }),
  z.object({ type: z.literal('ping') }),
]);

const queue = new PrintQueue(env.QUEUE_DIR);
let ws: WebSocket | null = null;
let reconnectDelay = env.RECONNECT_BASE_MS;
let processing = false;
let stopped = false;

function jitter(ms: number): number {
  return Math.round(ms * (0.85 + Math.random() * 0.3));
}

function sendJson(payload: unknown) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

async function processQueueOnce() {
  if (processing || stopped) return;
  processing = true;
  try {
    const items = await queue.listPending();
    for (const item of items) {
      if (stopped) break;
      await processItem(item);
    }
  } finally {
    processing = false;
  }
}

async function processItem(initial: QueueItem): Promise<void> {
  let item = initial;
  while (!stopped) {
    if (item.attempts >= env.MAX_RETRY_ATTEMPTS) {
      log.error(
        { id: item.id, attempts: item.attempts, lastError: item.lastError },
        'ticket discarded after max retries',
      );
      sendJson({ type: 'order.print_failed', orderId: item.id, error: item.lastError });
      // Kuyrukta kalsın ki operatör gözlemleyebilsin; donmuş ticket'ı
      // manuel flush-queue.js script'i temizler.
      return;
    }

    const reachable = await isPrinterReachable(printerOpts);
    if (!reachable) {
      item = await queue.markAttempt(item, 'printer_offline');
      const wait = jitter(Math.min(env.RETRY_BASE_MS * 2 ** item.attempts, env.RETRY_MAX_MS));
      log.warn({ id: item.id, attempts: item.attempts, wait }, 'printer offline, retrying');
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    try {
      await printKitchenTicket(item.ticket, printerOpts);
      await queue.markDone(item);
      sendJson({ type: 'order.printed', orderId: item.id });
      log.info({ id: item.id, attempts: item.attempts + 1 }, 'printed ok');
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      item = await queue.markAttempt(item, msg);
      const wait = jitter(Math.min(env.RETRY_BASE_MS * 2 ** item.attempts, env.RETRY_MAX_MS));
      log.error({ id: item.id, attempts: item.attempts, err: msg, wait }, 'print failed');
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

function connect(): void {
  if (stopped) return;
  const url = `${env.HASHTAP_API_WS}?token=${encodeURIComponent(env.PRINT_BRIDGE_TOKEN)}`;
  log.info({ url: env.HASHTAP_API_WS }, 'connecting');
  const socket = new WebSocket(url);
  ws = socket;

  socket.on('open', () => {
    log.info('connected');
    reconnectDelay = env.RECONNECT_BASE_MS;
    sendJson({ type: 'bridge.hello', pendingCount: 0 });
    processQueueOnce().catch((err) => log.error({ err }, 'initial queue sweep failed'));
  });

  socket.on('message', async (raw) => {
    let parsed: z.infer<typeof inboundSchema>;
    try {
      parsed = inboundSchema.parse(JSON.parse(raw.toString()));
    } catch (err) {
      log.warn({ err }, 'invalid inbound message dropped');
      return;
    }
    if (parsed.type === 'ping') {
      sendJson({ type: 'pong', at: new Date().toISOString() });
      return;
    }
    const enqueued = await queue.enqueue(parsed.order);
    if (enqueued) {
      sendJson({ type: 'order.received', orderId: parsed.order.id });
      processQueueOnce().catch((err) => log.error({ err }, 'queue process failed'));
    } else {
      log.debug({ id: parsed.order.id }, 'duplicate ticket ignored');
      sendJson({ type: 'order.duplicate', orderId: parsed.order.id });
    }
  });

  socket.on('close', () => {
    ws = null;
    if (stopped) return;
    const wait = jitter(Math.min(reconnectDelay, env.RECONNECT_MAX_MS));
    log.warn({ wait }, 'socket closed, reconnecting');
    reconnectDelay = Math.min(reconnectDelay * 2, env.RECONNECT_MAX_MS);
    setTimeout(connect, wait);
  });

  socket.on('error', (err) => log.error({ err }, 'socket error'));
}

function shutdown(signal: string) {
  if (stopped) return;
  stopped = true;
  log.info({ signal }, 'shutting down');
  ws?.close();
  setTimeout(() => process.exit(0), 200);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Startup: mevcut pending ticket'ları işle, sonra bağlan.
queue
  .listPending()
  .then((items) => {
    if (items.length) {
      log.info({ pending: items.length }, 'resuming pending tickets');
      return processQueueOnce();
    }
    return undefined;
  })
  .catch((err) => log.error({ err }, 'startup queue sweep failed'))
  .finally(() => connect());
