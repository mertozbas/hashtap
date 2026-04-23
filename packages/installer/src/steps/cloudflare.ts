import { execa } from 'execa';
import type { StepResult } from './docker.js';

/**
 * cloudflared Tunnel'ı Docker service olarak ayağa kaldır.
 * Tunnel token kullanıcı Cloudflare dashboard'dan alıp installer'a
 * vermiş olmalı. Tunnel konfigürasyonu ingress rules dashboard
 * tarafında yönetilir — bu adım sadece daemon'u çalıştırır.
 */
export async function runCloudflaredContainer(token: string): Promise<StepResult> {
  try {
    await execa(
      'docker',
      [
        'run',
        '-d',
        '--name',
        'hashtap-cloudflared',
        '--restart',
        'unless-stopped',
        '--network',
        'host',
        'cloudflare/cloudflared:latest',
        'tunnel',
        '--no-autoupdate',
        'run',
        '--token',
        token,
      ],
      { stdio: 'inherit' },
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

export async function checkPublicHostname(hostname: string): Promise<StepResult> {
  // DNS propagation kontrolü — Cloudflare Tunnel CNAME'in public olarak
  // çözündüğünden emin olmak için. Timeout'lu lookup, temiz bir fallback.
  try {
    const { stdout } = await execa('dig', ['+short', hostname], { reject: false });
    const hasRecord = stdout.trim().length > 0;
    return hasRecord
      ? { ok: true, detail: stdout.trim() }
      : {
          ok: false,
          detail: `${hostname} henüz çözülmüyor — DNS propagation 5-10 dk sürebilir`,
        };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}
