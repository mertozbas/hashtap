import { execa } from 'execa';
import type { StepResult } from './docker.js';

export async function tailscaleUp(authKey: string, hostname: string): Promise<StepResult> {
  try {
    await execa('tailscale', ['version'], { reject: false });
  } catch {
    return {
      ok: false,
      detail: 'tailscale bulunamadı — önce kur: https://tailscale.com/download',
    };
  }
  try {
    await execa(
      'tailscale',
      ['up', '--authkey', authKey, '--hostname', hostname, '--accept-routes=false'],
      { stdio: 'inherit' },
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

export async function tailscaleStatus(): Promise<string | null> {
  try {
    const { stdout } = await execa('tailscale', ['status', '--self', '--json=false']);
    return stdout.trim();
  } catch {
    return null;
  }
}
