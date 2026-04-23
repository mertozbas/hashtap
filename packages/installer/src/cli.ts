#!/usr/bin/env node
/**
 * HashTap restoran kurulum CLI.
 *
 * Kullanım:
 *   hashtap-installer              → interaktif wizard
 *   hashtap-installer --config x   → dosyadan config
 *   hashtap-installer --dry-run    → sadece plan göster, eylem yok
 *
 * İşlemler:
 *   1) wizard ile config topla
 *   2) .env yaz
 *   3) docker compose up (ops profile ile)
 *   4) Tailscale enroll (isteğe bağlı)
 *   5) cloudflared tunnel başlat (isteğe bağlı)
 *   6) Smoke test
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import chalk from 'chalk';
import { runWizard } from './wizard.js';
import { installConfigSchema, type InstallConfig } from './config.js';
import { writeEnvFile } from './env-file.js';
import { checkDocker, composeUp } from './steps/docker.js';
import { tailscaleUp } from './steps/tailscale.js';
import { runCloudflaredContainer, checkPublicHostname } from './steps/cloudflare.js';
import { runSmokeTest } from './steps/smoke-test.js';

interface Args {
  configPath?: string;
  dryRun: boolean;
  composeFile: string;
  installDir: string;
  restore?: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    dryRun: false,
    composeFile: 'infra/odoo/docker-compose.yml',
    installDir: process.env.HASHTAP_INSTALL_DIR || '/opt/hashtap',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--config') out.configPath = argv[++i];
    else if (a === '--compose') out.composeFile = argv[++i] ?? out.composeFile;
    else if (a === '--install-dir') out.installDir = argv[++i] ?? out.installDir;
    else if (a === '--restore') out.restore = argv[++i];
  }
  return out;
}

async function loadConfig(args: Args): Promise<InstallConfig> {
  if (args.configPath) {
    const raw = await fs.readFile(args.configPath, 'utf8');
    const parsed = installConfigSchema.parse(JSON.parse(raw));
    return parsed;
  }
  return runWizard();
}

function printHeader() {
  console.log('');
  console.log(chalk.hex('#FF6B3D').bold('HashTap Installer'));
  console.log(chalk.gray('restoran kurulum sihirbazı'));
  console.log('');
}

function logStep(n: number, name: string) {
  console.log(chalk.cyan(`\n[${n}] ${name}`));
}

function logOk(msg: string) {
  console.log(chalk.green('  ✓ ') + msg);
}

function logWarn(msg: string) {
  console.log(chalk.yellow('  ! ') + msg);
}

function logFail(msg: string) {
  console.log(chalk.red('  ✗ ') + msg);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  printHeader();

  if (args.restore) {
    console.log(chalk.yellow(`Restore modu (${args.restore}) — ayrı runbook'tan devam edin:`));
    console.log('  docs/runbooks/p0-cash-pc-unbootable.md §4');
    process.exit(0);
  }

  const cfg = await loadConfig(args);

  logStep(1, 'Konfigürasyon doğrulama');
  const parsed = installConfigSchema.safeParse(cfg);
  if (!parsed.success) {
    logFail('config geçersiz:');
    console.log(parsed.error.format());
    process.exit(1);
  }
  logOk(`installation_id=${cfg.installationId}, package=${cfg.package}`);

  if (args.dryRun) {
    logStep(2, '.env dosyası planı (dry-run)');
    console.log(chalk.gray('  /opt/hashtap/.env yazılacak'));
    logStep(3, 'Docker compose planı');
    console.log(chalk.gray(`  ${args.composeFile} --profile ops up -d`));
    if (cfg.tailscale.enabled) logStep(4, 'Tailscale enroll planı');
    if (cfg.cloudflare.enabled) logStep(5, 'Cloudflared tunnel planı');
    logStep(6, 'Smoke test planı');
    console.log(chalk.gray('  gateway /health + ops /health'));
    console.log(chalk.green('\nDry-run tamam — gerçek çalıştırma için --dry-run olmadan koş.\n'));
    return;
  }

  logStep(2, '.env dosyası yaz');
  await fs.mkdir(args.installDir, { recursive: true });
  const envPath = path.join(args.installDir, '.env');
  await writeEnvFile(envPath, cfg);
  logOk(envPath);

  logStep(3, 'Docker hazır mı?');
  const docker = await checkDocker();
  docker.ok ? logOk(docker.detail ?? 'docker OK') : logFail(docker.detail ?? 'docker yok');
  if (!docker.ok) process.exit(1);

  logStep(4, `Docker compose up (${args.composeFile})`);
  const up = await composeUp(args.composeFile, args.installDir, ['ops']);
  up.ok ? logOk('servisler ayakta') : logFail(up.detail ?? 'compose up başarısız');
  if (!up.ok) process.exit(1);

  if (cfg.tailscale.enabled && cfg.tailscale.authKey) {
    logStep(5, 'Tailscale enroll');
    const ts = await tailscaleUp(cfg.tailscale.authKey, `hashtap-${cfg.slug}`);
    ts.ok ? logOk('tailscale up') : logWarn(ts.detail ?? 'tailscale başarısız — elle kur');
  } else if (cfg.tailscale.enabled) {
    logWarn('Tailscale seçildi ama auth key verilmedi — atlanıyor');
  }

  if (cfg.cloudflare.enabled && cfg.cloudflare.tunnelToken) {
    logStep(6, 'Cloudflare Tunnel');
    const cf = await runCloudflaredContainer(cfg.cloudflare.tunnelToken);
    cf.ok ? logOk('cloudflared container ayakta') : logWarn(cf.detail ?? 'tunnel başarısız');
    if (cfg.cloudflare.hostname) {
      const dns = await checkPublicHostname(cfg.cloudflare.hostname);
      dns.ok ? logOk(`DNS çözülüyor: ${dns.detail}`) : logWarn(dns.detail ?? 'DNS kontrol edilemedi');
    }
  } else if (cfg.cloudflare.enabled) {
    logWarn('Cloudflare seçildi ama tunnel token verilmedi — atlanıyor');
  }

  logStep(7, 'Smoke test');
  const smoke = await runSmokeTest({
    gatewayUrl: 'http://localhost:4000',
    opsUrl: cfg.ops.opsUrl,
    installationId: cfg.installationId,
    installationToken: cfg.ops.installationToken,
  });
  smoke.ok
    ? logOk(smoke.detail ?? 'smoke OK')
    : logWarn(smoke.detail ?? 'smoke başarısız — logları kontrol et');

  console.log('');
  console.log(chalk.green.bold('Kurulum tamam.'));
  console.log(chalk.gray(`  /opt/hashtap/.env içeriğini dual-custody kasaya ekleyin.`));
  console.log(chalk.gray(`  ilk heartbeat birkaç dakika içinde ${cfg.ops.opsUrl} dashboard'a düşer.`));
  console.log('');
}

main().catch((err) => {
  console.error(chalk.red.bold('\nKurulum hatası:'));
  console.error(err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
