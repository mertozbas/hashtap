import { useEffect, useState } from 'react';
import {
  Card,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  useTheme,
} from '@hashtap/ui';
import { Moon, Sun, Monitor, RefreshCw, ExternalLink } from 'lucide-react';
import {
  fetchGatewayHealth,
  fetchOdooHealth,
  readInstallInfo,
  type GatewayHealth,
  type OdooHealth,
} from '../lib/installInfo.js';

export function SettingsScreen() {
  const { theme, setTheme, resolved } = useTheme();
  const info = readInstallInfo();
  const [odoo, setOdoo] = useState<OdooHealth | null>(null);
  const [gateway, setGateway] = useState<GatewayHealth | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const [o, g] = await Promise.all([fetchOdooHealth(), fetchGatewayHealth()]);
      setOdoo(o);
      setGateway(g);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refresh();
    const iv = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(iv);
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <CardTitle>Görünüm</CardTitle>
        <CardDescription>Tema tercihi — tarayıcıda saklanır.</CardDescription>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant={theme === 'dark' ? 'primary' : 'secondary'}
            leftIcon={<Moon className="h-4 w-4" />}
            onClick={() => setTheme('dark')}
          >
            Dark
          </Button>
          <Button
            variant={theme === 'light' ? 'primary' : 'secondary'}
            leftIcon={<Sun className="h-4 w-4" />}
            onClick={() => setTheme('light')}
          >
            Light
          </Button>
          <Button
            variant={theme === 'system' ? 'primary' : 'secondary'}
            leftIcon={<Monitor className="h-4 w-4" />}
            onClick={() => setTheme('system')}
          >
            Sistem
          </Button>
        </div>
        <div className="mt-3 text-xs text-textc-muted">Aktif: {resolved}</div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Sistem sağlığı</CardTitle>
            <CardDescription>30 saniyede bir otomatik yenilenir.</CardDescription>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={refresh}
            loading={refreshing}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Yenile
          </Button>
        </div>
        <ul className="mt-4 divide-y divide-white/6">
          <li className="flex items-center justify-between py-3">
            <span className="text-sm font-semibold">API ağ geçidi</span>
            <Badge tone={gateway?.status === 'ok' ? 'success' : 'danger'} dot pulsing={gateway?.status === 'ok'}>
              {gateway?.status === 'ok' ? 'çalışıyor' : 'erişilemiyor'}
            </Badge>
          </li>
          <li className="flex items-center justify-between py-3">
            <span className="text-sm font-semibold">Yönetici sunucusu</span>
            <Badge tone={odoo?.ok ? 'success' : 'danger'} dot pulsing={odoo?.ok}>
              {odoo?.ok ? 'çalışıyor' : odoo?.error ?? 'erişilemiyor'}
            </Badge>
          </li>
        </ul>
      </Card>

      <Card>
        <CardTitle>Kurulum bilgisi</CardTitle>
        <CardDescription>Bu PC'nin HashTap kurulumu.</CardDescription>
        <dl className="mt-4 grid gap-y-2 sm:grid-cols-[160px_1fr]">
          <Term name="Kurulum ID" value={info.installationId} />
          <Term name="Slug" value={info.slug} mono />
          <Term name="Paket" value={info.package.toUpperCase()} />
          <Term name="Sürüm" value={info.version} mono />
          <Term name="Build" value={info.buildTs ?? '—'} mono small />
          <Term name="PWA URL" value={info.pwaBaseUrl} mono small />
        </dl>
      </Card>

      <Card>
        <CardTitle>Hızlı linkler</CardTitle>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          <Quick href="http://localhost:8069/web" label="Yönetici Paneli" />
          <Quick href="http://localhost:8069/hashtap/kds" label="Mutfak ekranı" />
          <Quick href="http://localhost:8069/web#action=412" label="Menü kalemleri" />
          <Quick href="http://localhost:8069/web#action=415" label="Masalar" />
          <Quick href="http://localhost:8069/web#action=416" label="QR siparişleri" />
          <Quick href="http://localhost:8069/web#action=243" label="Müşteri faturaları" />
          <Quick href="http://localhost:8069/web#action=355" label="Stok / Ürünler" />
          <Quick href={info.pwaBaseUrl} label="Müşteri menüsü (PWA)" />
        </ul>
        <p className="mt-3 text-xs text-textc-muted">
          Operasyon ekibi için yönetici panelinin ilgili sayfaları. Yeni
          sekmede açılır.
        </p>
      </Card>
    </div>
  );
}

function Term({ name, value, mono, small }: { name: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <>
      <dt className="text-xs uppercase tracking-wide text-textc-muted">{name}</dt>
      <dd className={`${mono ? 'font-mono' : ''} ${small ? 'text-xs' : 'text-sm'} text-textc-primary truncate`}>
        {value}
      </dd>
    </>
  );
}

function Quick({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="ht-glass flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-white/8"
      >
        <span>{label}</span>
        <ExternalLink className="h-4 w-4 text-textc-muted" />
      </a>
    </li>
  );
}
