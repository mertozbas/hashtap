import WebSocket from 'ws';
import pino from 'pino';
import { z } from 'zod';
import { printKitchenTicket } from './printer.js';

const EnvSchema = z.object({
  HASHTAP_API_WS: z.string().url(),
  PRINT_BRIDGE_TOKEN: z.string().min(1),
  PRINTER_INTERFACE: z.string().default('tcp://192.168.1.100:9100')
});

const env = EnvSchema.parse(process.env);
const log = pino({ name: 'print-bridge' });

function connect(): void {
  const url = `${env.HASHTAP_API_WS}?token=${encodeURIComponent(env.PRINT_BRIDGE_TOKEN)}`;
  const ws = new WebSocket(url);

  ws.on('open', () => log.info('API bağlantısı açıldı'));
  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'order.paid') {
        await printKitchenTicket(msg.order, env.PRINTER_INTERFACE);
        ws.send(JSON.stringify({ type: 'order.printed', orderId: msg.order.id }));
      }
    } catch (err) {
      log.error({ err }, 'mesaj işlenemedi');
    }
  });
  ws.on('close', () => {
    log.warn('bağlantı kapandı, 3sn sonra yeniden denenecek');
    setTimeout(connect, 3000);
  });
  ws.on('error', (err) => log.error({ err }, 'ws hatası'));
}

connect();
