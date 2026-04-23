import os from 'node:os';
import { statfs } from 'node:fs/promises';
import { request } from 'undici';
import type { HeartbeatServiceHealth } from '@hashtap/shared';
import type { ServiceCheck } from './env.js';

export function uptimeSeconds(): number {
  return Math.floor(os.uptime());
}

export function memoryUsedPct(): number {
  const total = os.totalmem();
  const free = os.freemem();
  if (total === 0) return 0;
  return Number((((total - free) / total) * 100).toFixed(2));
}

export async function diskUsedPct(path = '/'): Promise<number> {
  try {
    const stat = await statfs(path);
    const total = Number(stat.blocks) * stat.bsize;
    const free = Number(stat.bfree) * stat.bsize;
    if (total === 0) return 0;
    return Number((((total - free) / total) * 100).toFixed(2));
  } catch {
    return 0;
  }
}

const CHECK_TIMEOUT_MS = 3_000;

export async function checkService(svc: ServiceCheck): Promise<HeartbeatServiceHealth> {
  try {
    const { statusCode } = await request(svc.url, {
      method: 'GET',
      headersTimeout: CHECK_TIMEOUT_MS,
      bodyTimeout: CHECK_TIMEOUT_MS,
    });
    if (statusCode >= 200 && statusCode < 300) return 'healthy';
    if (statusCode >= 500) return 'down';
    return 'degraded';
  } catch {
    return 'down';
  }
}

export async function collectServices(
  services: ServiceCheck[],
): Promise<Record<string, HeartbeatServiceHealth>> {
  const entries = await Promise.all(
    services.map(async (svc) => [svc.name, await checkService(svc)] as const),
  );
  return Object.fromEntries(entries);
}
