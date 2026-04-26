import { describe, it, expect } from 'vitest';
import {
  installConfigSchema,
  defaultInstallationId,
  defaultTenantId,
} from '../config.js';

describe('installConfigSchema', () => {
  const baseValid = {
    installationId: 'rest-1',
    slug: 'kafe-test',
    restaurantName: 'Test',
    tenantId: '00000000-0000-0000-0000-000000000001',
    package: 'pro' as const,
    version: '0.1.0',
    admin: { email: 'a@b.com', password: 'longenoughpw' },
    iyzico: { mode: 'sandbox' as const, apiKey: 'k', secretKey: 's' },
    earsiv: { provider: 'mock' as const },
    ops: { opsUrl: 'https://ops.example.com', installationToken: 't' },
    cloudflare: { enabled: false },
    tailscale: { enabled: false },
    network: { caddyHttpPort: 80, caddyHttpsPort: 443 },
  };

  it('accepts a fully valid config', () => {
    const r = installConfigSchema.safeParse(baseValid);
    expect(r.success).toBe(true);
  });

  it('rejects bad slug (uppercase)', () => {
    const r = installConfigSchema.safeParse({ ...baseValid, slug: 'BAD' });
    expect(r.success).toBe(false);
  });

  it('rejects short admin password', () => {
    const r = installConfigSchema.safeParse({
      ...baseValid,
      admin: { email: 'a@b.com', password: 'short' },
    });
    expect(r.success).toBe(false);
  });

  it('rejects bad email', () => {
    const r = installConfigSchema.safeParse({
      ...baseValid,
      admin: { email: 'not-email', password: 'longenoughpw' },
    });
    expect(r.success).toBe(false);
  });

  it('rejects unknown package', () => {
    const r = installConfigSchema.safeParse({ ...baseValid, package: 'gold' });
    expect(r.success).toBe(false);
  });

  it('rejects bad opsUrl', () => {
    const r = installConfigSchema.safeParse({
      ...baseValid,
      ops: { opsUrl: 'not-a-url', installationToken: 't' },
    });
    expect(r.success).toBe(false);
  });
});

describe('defaultInstallationId', () => {
  it('starts with rest- and is unique-ish', () => {
    const a = defaultInstallationId();
    const b = defaultInstallationId();
    expect(a).toMatch(/^rest-/);
    expect(b).toMatch(/^rest-/);
    expect(a).not.toBe(b);
  });
});

describe('defaultTenantId', () => {
  it('produces RFC4122 v4 UUID', () => {
    const u = defaultTenantId();
    expect(u).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
