import * as React from 'react';

export type Theme = 'dark' | 'light' | 'system';
type Resolved = 'dark' | 'light';

const STORAGE_KEY = 'hashtap:theme';

function systemPreference(): Resolved {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function readStored(): Theme {
  if (typeof window === 'undefined') return 'system';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'dark' || v === 'light' || v === 'system' ? v : 'system';
}

function applyDom(resolved: Resolved) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('light', resolved === 'light');
  root.classList.toggle('dark', resolved === 'dark');
}

export function useTheme() {
  const [theme, setTheme] = React.useState<Theme>(() => readStored());
  const [resolved, setResolved] = React.useState<Resolved>(() =>
    readStored() === 'light'
      ? 'light'
      : readStored() === 'dark'
        ? 'dark'
        : systemPreference(),
  );

  React.useEffect(() => {
    const next: Resolved = theme === 'system' ? systemPreference() : theme;
    setResolved(next);
    applyDom(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  React.useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    function listener() {
      const next: Resolved = mq.matches ? 'light' : 'dark';
      setResolved(next);
      applyDom(next);
    }
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [theme]);

  return { theme, resolved, setTheme } as const;
}
