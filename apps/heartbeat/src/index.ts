import { heartbeatSchema, type Heartbeat } from '@hashtap/shared';
import { env, parseServices } from './env.js';
import { collectServices, diskUsedPct, memoryUsedPct, uptimeSeconds } from './collect.js';
import { postHeartbeat } from './post.js';

const log = {
  info: (msg: string, data?: unknown) =>
    console.log(JSON.stringify({ level: 'info', ts: new Date().toISOString(), msg, data })),
  warn: (msg: string, data?: unknown) =>
    console.warn(JSON.stringify({ level: 'warn', ts: new Date().toISOString(), msg, data })),
  error: (msg: string, data?: unknown) =>
    console.error(JSON.stringify({ level: 'error', ts: new Date().toISOString(), msg, data })),
};

async function buildHeartbeat(): Promise<Heartbeat> {
  const services = parseServices(env.HEARTBEAT_SERVICES);
  const [servicesHealth, disk] = await Promise.all([
    collectServices(services),
    diskUsedPct('/'),
  ]);
  return heartbeatSchema.parse({
    installation_id: env.HASHTAP_INSTALLATION_ID,
    slug: env.HASHTAP_SLUG,
    version: env.HASHTAP_VERSION,
    uptime_seconds: uptimeSeconds(),
    disk_used_pct: disk,
    memory_used_pct: memoryUsedPct(),
    services: servicesHealth,
    collected_at: new Date().toISOString(),
  });
}

async function tick(): Promise<number> {
  const hb = await buildHeartbeat();
  const result = await postHeartbeat(env.HASHTAP_OPS_URL, env.HASHTAP_INSTALLATION_TOKEN, hb);
  if (result.ok && result.ack) {
    log.info('heartbeat_sent', {
      installation_id: hb.installation_id,
      services: hb.services,
      disk_used_pct: hb.disk_used_pct,
      memory_used_pct: hb.memory_used_pct,
      next_interval_seconds: result.ack.next_interval_seconds,
    });
    return result.ack.next_interval_seconds;
  }
  log.error('heartbeat_failed', {
    installation_id: hb.installation_id,
    statusCode: result.statusCode,
    error: result.error,
  });
  return env.HEARTBEAT_INTERVAL_SECONDS;
}

let stopped = false;
function shutdown(reason: string) {
  log.info('shutting_down', { reason });
  stopped = true;
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

async function main() {
  log.info('heartbeat_daemon_start', {
    installation_id: env.HASHTAP_INSTALLATION_ID,
    ops_url: env.HASHTAP_OPS_URL,
    interval_s: env.HEARTBEAT_INTERVAL_SECONDS,
  });
  while (!stopped) {
    let delay = env.HEARTBEAT_INTERVAL_SECONDS;
    try {
      delay = await tick();
    } catch (err) {
      log.error('tick_threw', { error: err instanceof Error ? err.message : String(err) });
    }
    await new Promise((resolve) => setTimeout(resolve, delay * 1000));
  }
}

main();
