import { z } from 'zod';

const schema = z.object({
  HASHTAP_API_WS: z.string().url(),
  PRINT_BRIDGE_TOKEN: z.string().min(1),
  PRINTER_INTERFACE: z.string().default('tcp://192.168.1.100:9100'),
  PRINTER_MODEL: z.enum(['epson', 'star']).default('epson'),
  QUEUE_DIR: z.string().default('/var/spool/hashtap'),
  MAX_RETRY_ATTEMPTS: z.coerce.number().int().positive().default(10),
  RETRY_BASE_MS: z.coerce.number().int().positive().default(2000),
  RETRY_MAX_MS: z.coerce.number().int().positive().default(60000),
  RECONNECT_BASE_MS: z.coerce.number().int().positive().default(1500),
  RECONNECT_MAX_MS: z.coerce.number().int().positive().default(30000),
  DEDUP_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
});

export const env = schema.parse(process.env);
