import fs from 'node:fs/promises';
import type { InstallConfig } from './config.js';

function escape(value: string): string {
  if (/[\s"'=]/.test(value)) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}

export function renderEnvFile(cfg: InstallConfig): string {
  const lines: string[] = [
    '# HashTap restoran .env — installer tarafından üretildi.',
    `# Kurulum: ${cfg.installationId} (${cfg.slug})`,
    `# Tarih: ${new Date().toISOString()}`,
    '',
    `HASHTAP_INSTALLATION_ID=${escape(cfg.installationId)}`,
    `HASHTAP_SLUG=${escape(cfg.slug)}`,
    `HASHTAP_RESTAURANT_NAME=${escape(cfg.restaurantName)}`,
    `HASHTAP_TENANT_ID=${escape(cfg.tenantId)}`,
    `HASHTAP_PACKAGE=${escape(cfg.package)}`,
    `HASHTAP_VERSION=${escape(cfg.version)}`,
    '',
    `ADMIN_EMAIL=${escape(cfg.admin.email)}`,
    `ADMIN_PASSWORD=${escape(cfg.admin.password)}`,
    '',
    `IYZICO_MODE=${escape(cfg.iyzico.mode)}`,
    `IYZICO_API_KEY=${escape(cfg.iyzico.apiKey)}`,
    `IYZICO_SECRET_KEY=${escape(cfg.iyzico.secretKey)}`,
  ];
  if (cfg.iyzico.subMerchantKey) {
    lines.push(`IYZICO_SUBMERCHANT_KEY=${escape(cfg.iyzico.subMerchantKey)}`);
  }
  lines.push(
    '',
    `EARSIV_PROVIDER=${escape(cfg.earsiv.provider)}`,
  );
  if (cfg.earsiv.username) {
    lines.push(`EARSIV_USERNAME=${escape(cfg.earsiv.username)}`);
  }
  if (cfg.earsiv.password) {
    lines.push(`EARSIV_PASSWORD=${escape(cfg.earsiv.password)}`);
  }
  lines.push(
    '',
    `HASHTAP_OPS_URL=${escape(cfg.ops.opsUrl)}`,
    `HASHTAP_INSTALLATION_TOKEN=${escape(cfg.ops.installationToken)}`,
    '',
    `CLOUDFLARE_TUNNEL_ENABLED=${cfg.cloudflare.enabled ? 'true' : 'false'}`,
  );
  if (cfg.cloudflare.tunnelToken) {
    lines.push(`CLOUDFLARE_TUNNEL_TOKEN=${escape(cfg.cloudflare.tunnelToken)}`);
  }
  if (cfg.cloudflare.hostname) {
    lines.push(`CLOUDFLARE_HOSTNAME=${escape(cfg.cloudflare.hostname)}`);
  }
  lines.push(
    '',
    `TAILSCALE_ENABLED=${cfg.tailscale.enabled ? 'true' : 'false'}`,
  );
  if (cfg.tailscale.authKey) {
    lines.push(`TAILSCALE_AUTH_KEY=${escape(cfg.tailscale.authKey)}`);
  }
  lines.push(
    '',
    `CADDY_HTTP_PORT=${cfg.network.caddyHttpPort}`,
    `CADDY_HTTPS_PORT=${cfg.network.caddyHttpsPort}`,
    '',
  );

  return lines.join('\n');
}

export async function writeEnvFile(path: string, cfg: InstallConfig): Promise<void> {
  const content = renderEnvFile(cfg);
  await fs.writeFile(path, content, { mode: 0o600 });
}
