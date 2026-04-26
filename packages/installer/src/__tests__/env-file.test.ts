import { describe, it, expect } from 'vitest';
import { renderEnvFile } from '../env-file.js';
import type { InstallConfig } from '../config.js';

const cfg: InstallConfig = {
  installationId: 'rest-1',
  slug: 'kafe-test',
  restaurantName: 'Test "Cafe"',
  tenantId: '00000000-0000-0000-0000-000000000001',
  package: 'pro',
  version: '0.1.0',
  admin: { email: 'a@b.com', password: 'sec ret pass' },
  iyzico: { mode: 'sandbox', apiKey: 'k', secretKey: 's' },
  earsiv: { provider: 'foriba', username: 'u', password: 'p' },
  ops: { opsUrl: 'https://ops.example.com', installationToken: 'tok' },
  cloudflare: {
    enabled: true,
    tunnelToken: 'cf-tok',
    hostname: 'qr.kafe-test.hashtap.app',
  },
  tailscale: { enabled: true, authKey: 'tskey-x' },
  network: { caddyHttpPort: 80, caddyHttpsPort: 443 },
};

describe('renderEnvFile', () => {
  it('emits required keys', () => {
    const out = renderEnvFile(cfg);
    expect(out).toContain('HASHTAP_INSTALLATION_ID=rest-1');
    expect(out).toContain('HASHTAP_SLUG=kafe-test');
    expect(out).toContain('HASHTAP_TENANT_ID=00000000-0000-0000-0000-000000000001');
    expect(out).toContain('HASHTAP_PACKAGE=pro');
    expect(out).toContain('CLOUDFLARE_TUNNEL_ENABLED=true');
    expect(out).toContain('TAILSCALE_ENABLED=true');
  });

  it('escapes values with whitespace and quotes', () => {
    const out = renderEnvFile(cfg);
    // Restaurant name has a double-quote → must be quoted + escaped
    expect(out).toMatch(/HASHTAP_RESTAURANT_NAME="Test \\"Cafe\\""/);
    // Admin password has spaces → quoted
    expect(out).toMatch(/ADMIN_PASSWORD="sec ret pass"/);
  });

  it('skips optional iyzico subMerchantKey when missing', () => {
    const out = renderEnvFile(cfg);
    expect(out).not.toContain('IYZICO_SUBMERCHANT_KEY');
  });

  it('omits cloudflare keys when disabled', () => {
    const out = renderEnvFile({
      ...cfg,
      cloudflare: { enabled: false },
    });
    expect(out).toContain('CLOUDFLARE_TUNNEL_ENABLED=false');
    expect(out).not.toContain('CLOUDFLARE_TUNNEL_TOKEN');
    expect(out).not.toContain('CLOUDFLARE_HOSTNAME');
  });
});
