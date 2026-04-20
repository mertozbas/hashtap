import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  API_PORT: z.coerce.number().default(4000),
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  ODOO_BASE_URL: z.string().url().default('http://localhost:8069'),
  ODOO_TENANT_RESOLVER: z.enum(['static', 'registry']).default('static'),
  ODOO_STATIC_DB: z.string().default('demo'),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
