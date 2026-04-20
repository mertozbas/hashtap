import { request } from 'undici';
import { env } from './config/env.js';

async function call(db: string, path: string, init: Parameters<typeof request>[1]) {
  const url = `${env.ODOO_BASE_URL}${path}`;
  const res = await request(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-odoo-db': db,
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.body.json();
  if (res.statusCode >= 400) {
    throw Object.assign(new Error(`odoo ${res.statusCode}`), { status: res.statusCode, body });
  }
  return body;
}

export const odooGet = (db: string, path: string) => call(db, path, { method: 'GET' });
export const odooPost = (db: string, path: string, body: unknown) =>
  call(db, path, { method: 'POST', body: JSON.stringify(body) });
