/** Kurulum/sürüm/sağlık bilgisi — Settings ekranı tarafından kullanılır. */

export interface OdooHealth {
  ok: boolean;
  ts?: string;
  error?: string;
}

export interface GatewayHealth {
  status: string;
  ts: string;
}

export interface InstallInfo {
  version: string;
  buildTs: string | null;
  installationId: string;
  slug: string;
  package: string;
  pwaBaseUrl: string;
}

export async function fetchOdooHealth(): Promise<OdooHealth> {
  try {
    const res = await fetch('/web/health', { method: 'GET' });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, ts: new Date().toISOString() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}

export async function fetchGatewayHealth(): Promise<GatewayHealth | null> {
  try {
    const res = await fetch('/health');
    if (!res.ok) return null;
    return (await res.json()) as GatewayHealth;
  } catch {
    return null;
  }
}

export function readInstallInfo(): InstallInfo {
  const env = (import.meta.env || {}) as Record<string, string | undefined>;
  return {
    version: env.VITE_HASHTAP_VERSION ?? '0.1.0',
    buildTs: env.VITE_BUILD_TS ?? null,
    installationId: env.VITE_INSTALLATION_ID ?? 'dev',
    slug: env.VITE_SLUG ?? 'dev-restoran',
    package: env.VITE_PACKAGE ?? 'pro',
    pwaBaseUrl: env.VITE_PWA_BASE_URL ?? 'http://localhost:5173',
  };
}
