import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  OPS_PORT: z.coerce.number().default(4100),
  OPS_DATABASE_URL: z
    .string()
    .default('postgres://hashtap:hashtap@localhost:5432/hashtap_ops'),
  OPS_HEARTBEAT_INTERVAL_SECONDS: z.coerce.number().int().positive().default(60),
  OPS_INSTALLATION_TOKENS: z
    .string()
    .default('')
    .describe('CSV of installation_id:token pairs — dev only; prod uses DB lookup'),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;

export function parseInstallationTokens(csv: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of csv.split(',').map((s) => s.trim()).filter(Boolean)) {
    const [id, token] = entry.split(':');
    if (id && token) map.set(id, token);
  }
  return map;
}
