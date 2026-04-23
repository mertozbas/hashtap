import { execa } from 'execa';

export interface StepResult {
  ok: boolean;
  detail?: string;
}

export async function checkDocker(): Promise<StepResult> {
  try {
    const { stdout } = await execa('docker', ['version', '--format', '{{.Server.Version}}']);
    return { ok: true, detail: `docker server ${stdout.trim()}` };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : 'docker bulunamadı veya yanıt vermedi',
    };
  }
}

export async function composeUp(
  composeFile: string,
  cwd: string,
  profiles: string[] = [],
): Promise<StepResult> {
  const args = ['compose', '-f', composeFile];
  for (const p of profiles) args.push('--profile', p);
  args.push('up', '-d');
  try {
    await execa('docker', args, { cwd, stdio: 'inherit' });
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

export async function composeDown(
  composeFile: string,
  cwd: string,
): Promise<StepResult> {
  try {
    await execa('docker', ['compose', '-f', composeFile, 'down'], { cwd, stdio: 'inherit' });
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}
