import { NavLink, useNavigate } from 'react-router-dom';
import { Grid3x3, Bell, LogOut } from 'lucide-react';
import { LiveIndicator, cn } from '@hashtap/ui';
import { useLiveStatus } from '../store/live.js';
import { useNotifStore } from '../store/notifications.js';

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const status = useLiveStatus();
  const unread = useNotifStore((s) => s.items.filter((n) => !n.readAt).length);

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col">
      <header className="flex items-center justify-between px-4 pt-4 pb-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-left"
        >
          <span className="text-lg font-bold text-brand-500">HashTap</span>
          <span className="text-[10px] uppercase tracking-wide text-textc-muted">Garson</span>
        </button>
        <div className="flex items-center gap-2">
          <LiveIndicator status={status} />
          <button
            onClick={() => navigate('/notifications')}
            className="relative flex h-10 w-10 items-center justify-center rounded-full ht-glass"
            aria-label={`Bildirimler (${unread} okunmamış)`}
          >
            <Bell className="h-5 w-5" />
            {unread > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-20">{children}</main>

      <nav className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 border-t border-white/8 ht-glass">
        <ul className="flex items-center justify-around px-2 py-2">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  'flex min-h-touch min-w-touch flex-col items-center justify-center gap-1 rounded-xl px-3',
                  isActive ? 'text-brand-400 bg-white/6' : 'text-textc-muted',
                )
              }
            >
              <Grid3x3 className="h-5 w-5" />
              <span className="text-xs font-semibold">Masalar</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                cn(
                  'flex min-h-touch min-w-touch flex-col items-center justify-center gap-1 rounded-xl px-3',
                  isActive ? 'text-brand-400 bg-white/6' : 'text-textc-muted',
                )
              }
            >
              <Bell className="h-5 w-5" />
              <span className="text-xs font-semibold">Bildirim</span>
            </NavLink>
          </li>
          <li>
            <button className="flex min-h-touch min-w-touch flex-col items-center justify-center gap-1 rounded-xl px-3 text-textc-muted">
              <LogOut className="h-5 w-5" />
              <span className="text-xs font-semibold">Çıkış</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
