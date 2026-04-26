import { NavLink, useNavigate } from 'react-router-dom';
import { Grid3x3, ListOrdered, Plus, ClipboardCheck, Settings as Cog } from 'lucide-react';
import { LiveIndicator, cn } from '@hashtap/ui';
import { useLiveStatus } from '../store/live.js';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Salon', icon: <Grid3x3 className="h-5 w-5" /> },
  { to: '/orders', label: 'Siparişler', icon: <ListOrdered className="h-5 w-5" /> },
  { to: '/orders/new', label: 'Yeni', icon: <Plus className="h-6 w-6" />, primary: true },
  { to: '/day-close', label: 'Gün sonu', icon: <ClipboardCheck className="h-5 w-5" /> },
  { to: '/settings', label: 'Ayarlar', icon: <Cog className="h-5 w-5" /> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const status = useLiveStatus();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/8 ht-glass">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 text-left"
          aria-label="Ana sayfaya dön"
        >
          <span className="text-xl font-bold text-brand-500">HashTap</span>
          <span className="text-xs uppercase tracking-wide text-textc-muted">Kasa</span>
        </button>
        <LiveIndicator status={status} />
      </header>

      <main className="flex-1 px-6 py-6">{children}</main>

      <nav
        aria-label="Ana navigasyon"
        className="sticky bottom-0 border-t border-white/8 ht-glass"
      >
        <ul className="mx-auto flex max-w-4xl items-center justify-around px-4 py-2">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-1 rounded-xl',
                    'min-h-touch min-w-touch px-3 py-2',
                    'transition-colors duration-fast ease-smooth',
                    item.primary
                      ? 'bg-brand-500 text-white shadow-glow'
                      : isActive
                        ? 'text-brand-400 bg-white/6'
                        : 'text-textc-muted hover:text-textc-primary',
                  )
                }
              >
                {item.icon}
                <span className="text-xs font-semibold">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
