import type { FastifyInstance } from 'fastify';
import { heartbeatSchema } from '@hashtap/shared';
import { env, parseInstallationTokens } from '../config/env.js';
import { pool } from '../db.js';

const tokens = parseInstallationTokens(env.OPS_INSTALLATION_TOKENS);

function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export async function heartbeatRoutes(app: FastifyInstance) {
  app.post('/heartbeat', async (req, reply) => {
    const parsed = heartbeatSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_body', details: parsed.error.issues });
    }
    const hb = parsed.data;

    const token = extractBearer(req.headers.authorization);
    const expected = tokens.get(hb.installation_id);
    if (!token || !expected || token !== expected) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    await pool.query(
      `INSERT INTO heartbeats (installation_id, collected_at, version, uptime_seconds,
         disk_used_pct, memory_used_pct, services, metrics_24h)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        hb.installation_id,
        hb.collected_at,
        hb.version,
        hb.uptime_seconds,
        hb.disk_used_pct,
        hb.memory_used_pct,
        JSON.stringify(hb.services),
        hb.metrics_24h ? JSON.stringify(hb.metrics_24h) : null,
      ],
    );

    await pool.query(
      `UPDATE installations SET last_seen_at = now() WHERE installation_id = $1`,
      [hb.installation_id],
    );

    return reply.send({
      received_at: new Date().toISOString(),
      installation_id: hb.installation_id,
      next_interval_seconds: env.OPS_HEARTBEAT_INTERVAL_SECONDS,
    });
  });

  app.get('/installations/:id/latest', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { rows } = await pool.query(
      `SELECT installation_id, collected_at, received_at, version, uptime_seconds,
              disk_used_pct, memory_used_pct, services, metrics_24h
       FROM heartbeats
       WHERE installation_id = $1
       ORDER BY collected_at DESC
       LIMIT 1`,
      [id],
    );
    if (rows.length === 0) return reply.status(404).send({ error: 'not_found' });
    return reply.send(rows[0]);
  });
}
