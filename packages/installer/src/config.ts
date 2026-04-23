import { z } from 'zod';

export const installConfigSchema = z.object({
  installationId: z.string().min(1),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'sadece küçük harf, rakam ve tire'),
  restaurantName: z.string().min(1),
  tenantId: z.string().uuid(),
  package: z.enum(['menu', 'mobile', 'pro', 'max']),
  version: z.string().default('0.1.0'),
  admin: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  iyzico: z.object({
    mode: z.enum(['sandbox', 'live']),
    apiKey: z.string().min(1),
    secretKey: z.string().min(1),
    subMerchantKey: z.string().optional(),
  }),
  earsiv: z.object({
    provider: z.enum(['foriba', 'uyumsoft', 'mock']),
    username: z.string().optional(),
    password: z.string().optional(),
  }),
  ops: z.object({
    opsUrl: z.string().url(),
    installationToken: z.string().min(1),
  }),
  cloudflare: z.object({
    tunnelToken: z.string().optional(),
    hostname: z.string().optional(),
    enabled: z.boolean(),
  }),
  tailscale: z.object({
    authKey: z.string().optional(),
    enabled: z.boolean(),
  }),
  network: z.object({
    hostIp: z.string().optional(),
    caddyHttpPort: z.coerce.number().default(80),
    caddyHttpsPort: z.coerce.number().default(443),
  }),
});

export type InstallConfig = z.infer<typeof installConfigSchema>;

export function defaultInstallationId(): string {
  return `rest-${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultTenantId(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  // RFC 4122 v4
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20,
  )}-${hex.slice(20)}`;
}
