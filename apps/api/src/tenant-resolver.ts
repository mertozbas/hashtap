import { env } from './config/env.js';

export async function resolveTenantDb(tenantSlug: string): Promise<string> {
  if (env.ODOO_TENANT_RESOLVER === 'static') {
    return env.ODOO_STATIC_DB;
  }
  throw new Error('registry resolver not implemented');
}
