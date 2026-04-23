import { input, password, select, confirm } from '@inquirer/prompts';
import {
  defaultInstallationId,
  defaultTenantId,
  type InstallConfig,
} from './config.js';

export async function runWizard(): Promise<InstallConfig> {
  const installationId = await input({
    message: 'Kurulum ID',
    default: defaultInstallationId(),
    validate: (v) => (v.length >= 3 ? true : 'en az 3 karakter'),
  });

  const slug = await input({
    message: 'Restoran slug (kebab-case, örn: kafe-cumhuriyet)',
    validate: (v) =>
      /^[a-z0-9-]{2,}$/.test(v) ? true : 'sadece küçük harf, rakam, tire',
  });

  const restaurantName = await input({
    message: 'Restoran adı (faturada/yönetici panelinde gözükür)',
  });

  const pkg = (await select({
    message: 'Paket',
    default: 'pro',
    choices: [
      { value: 'menu', name: 'A — HashTap Menü (kısıtlı lisans)' },
      { value: 'mobile', name: 'B — HashTap Mobile (kısıtlı lisans)' },
      { value: 'pro', name: 'C — HashTap Pro (full ERP, popüler)' },
      { value: 'max', name: 'D — HashTap Max (full ERP + markalı donanım)' },
    ],
  })) as InstallConfig['package'];

  const adminEmail = await input({
    message: 'Yönetici e-postası',
    validate: (v) => (/.+@.+\..+/.test(v) ? true : 'geçerli bir e-posta girin'),
  });
  const adminPassword = await password({
    message: 'Yönetici şifresi (en az 8 karakter)',
    mask: '*',
    validate: (v) => (v.length >= 8 ? true : 'en az 8 karakter'),
  });

  const iyzicoMode = (await select({
    message: 'iyzico modu',
    default: 'sandbox',
    choices: [
      { value: 'sandbox', name: 'Sandbox (test)' },
      { value: 'live', name: 'Live (üretim)' },
    ],
  })) as 'sandbox' | 'live';
  const iyzicoApiKey = await input({ message: 'iyzico API Key' });
  const iyzicoSecretKey = await password({ message: 'iyzico Secret Key', mask: '*' });
  const iyzicoSubMerchantKey = await input({
    message: 'iyzico subMerchantKey (opsiyonel — boş bırakılabilir)',
    default: '',
  });

  const earsivProvider = (await select({
    message: 'e-Arşiv sağlayıcı',
    default: 'foriba',
    choices: [
      { value: 'foriba', name: 'Foriba' },
      { value: 'uyumsoft', name: 'Uyumsoft' },
      { value: 'mock', name: 'Mock (sandbox — test)' },
    ],
  })) as 'foriba' | 'uyumsoft' | 'mock';
  const earsivUsername =
    earsivProvider === 'mock'
      ? ''
      : await input({ message: `${earsivProvider} kullanıcı adı` });
  const earsivPassword =
    earsivProvider === 'mock'
      ? ''
      : await password({ message: `${earsivProvider} şifre`, mask: '*' });

  const opsUrl = await input({
    message: 'HashTap ops URL',
    default: 'https://ops.hashtap.app',
  });
  const installationToken = await password({
    message: 'Kurulum token (HashTap tarafından verilen)',
    mask: '*',
  });

  const cfEnabled = await confirm({
    message: 'Cloudflare Tunnel kurulacak mı? (dış erişim için)',
    default: true,
  });
  const cfTunnelToken = cfEnabled
    ? await password({ message: 'Cloudflare Tunnel token', mask: '*' })
    : '';
  const cfHostname = cfEnabled
    ? await input({
        message: 'Dış alan adı (örn: qr.kafe-cumhuriyet.hashtap.app)',
        default: `qr.${slug}.hashtap.app`,
      })
    : '';

  const tsEnabled = await confirm({
    message: 'Tailscale kurulacak mı? (uzaktan destek için)',
    default: true,
  });
  const tsAuthKey = tsEnabled
    ? await password({ message: 'Tailscale auth key', mask: '*' })
    : '';

  return {
    installationId,
    slug,
    restaurantName,
    tenantId: defaultTenantId(),
    package: pkg,
    version: '0.1.0',
    admin: { email: adminEmail, password: adminPassword },
    iyzico: {
      mode: iyzicoMode,
      apiKey: iyzicoApiKey,
      secretKey: iyzicoSecretKey,
      subMerchantKey: iyzicoSubMerchantKey || undefined,
    },
    earsiv: {
      provider: earsivProvider,
      username: earsivUsername || undefined,
      password: earsivPassword || undefined,
    },
    ops: { opsUrl, installationToken },
    cloudflare: {
      enabled: cfEnabled,
      tunnelToken: cfTunnelToken || undefined,
      hostname: cfHostname || undefined,
    },
    tailscale: {
      enabled: tsEnabled,
      authKey: tsAuthKey || undefined,
    },
    network: {
      caddyHttpPort: 80,
      caddyHttpsPort: 443,
    },
  };
}
