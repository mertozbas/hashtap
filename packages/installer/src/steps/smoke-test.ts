import type { StepResult } from './docker.js';

interface SmokeOpts {
  gatewayUrl: string;
  opsUrl: string;
  installationToken: string;
  installationId: string;
}

async function tryGet(url: string, timeoutMs = 5000): Promise<{ ok: boolean; status?: number; error?: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

export async function runSmokeTest(opts: SmokeOpts): Promise<StepResult> {
  const results: string[] = [];
  let ok = true;

  const gatewayHealth = await tryGet(`${opts.gatewayUrl.replace(/\/$/, '')}/health`);
  if (gatewayHealth.ok) {
    results.push('gateway /health: OK');
  } else {
    ok = false;
    results.push(
      `gateway /health: FAIL (${gatewayHealth.status ?? 'network'} — ${gatewayHealth.error ?? ''})`,
    );
  }

  const opsHealth = await tryGet(`${opts.opsUrl.replace(/\/$/, '')}/health`);
  if (opsHealth.ok) {
    results.push('ops /health: OK');
  } else {
    ok = false;
    results.push(
      `ops /health: FAIL (${opsHealth.status ?? 'network'} — ${opsHealth.error ?? ''})`,
    );
  }

  return { ok, detail: results.join('\n  ') };
}
