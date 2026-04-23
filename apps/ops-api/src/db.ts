import pg from 'pg';
import { env } from './config/env.js';

const { Pool } = pg;

export const pool = new Pool({ connectionString: env.OPS_DATABASE_URL });

export async function withClient<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
