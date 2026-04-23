import { Card, CardTitle, CardDescription, Button, useTheme } from '@hashtap/ui';
import { Moon, Sun, Monitor } from 'lucide-react';

export function SettingsScreen() {
  const { theme, setTheme, resolved } = useTheme();
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
        <div className="mt-4 text-xs text-textc-muted">Aktif: {resolved}</div>
      </Card>

      <Card>
        <CardTitle>Kurulum bilgisi</CardTitle>
        <CardDescription>Bu PC'nin HashTap ops'a kayıtlı olduğu kurulum.</CardDescription>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-textc-muted">Kurulum ID</dt>
            <dd className="font-mono">—</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-textc-muted">Slug</dt>
            <dd className="font-mono">—</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-textc-muted">Sürüm</dt>
            <dd className="font-mono">0.1.0</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
