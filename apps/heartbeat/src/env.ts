import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  HASHTAP_INSTALLATION_ID: z.string().default('dev-install'),
  HASHTAP_SLUG: z.string().default('dev-restoran'),
  HASHTAP_VERSION: z.string().default('0.1.0'),
  HASHTAP_OPS_URL: z.string().url().default('http://localhost:4100'),
  HASHTAP_INSTALLATION_TOKEN: z.string().default(''),
  HEARTBEAT_INTERVAL_SECONDS: z.coerce.number().int().positive().default(60),
  HEARTBEAT_SERVICES: z
    .string()
    .default('odoo=http://localhost:8069/web/health,gateway=http://localhost:4000/health')
    .describe('CSV of name=url entries; HTTP 2xx = healthy'),
});

export const env = schema.parse(process.env);

export interface ServiceCheck {
  name: string;
  url: string;
}

export function parseServices(csv: string): ServiceCheck[] {
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [name, url] = entry.split('=');
      if (!name || !url) throw new Error(`invalid service entry: "${entry}"`);
      return { name, url };
    });
}
