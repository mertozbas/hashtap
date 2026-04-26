import { useEffect } from 'react';
import { create } from 'zustand';
import type { LiveStatus } from '@hashtap/ui';

interface LiveState {
  status: LiveStatus;
  setStatus: (s: LiveStatus) => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  status: 'connecting',
  setStatus: (status) => set({ status }),
}));

export function useLiveStatus(): LiveStatus {
  return useLiveStore((s) => s.status);
}

export function useLiveHealthPolling(): void {
  const setStatus = useLiveStore((s) => s.setStatus);
  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (!cancelled) setStatus('disconnected');
        return;
      }
      try {
        const res = await fetch('/health', { cache: 'no-store' });
        if (cancelled) return;
        setStatus(res.ok ? 'connected' : 'disconnected');
      } catch {
        if (!cancelled) setStatus('disconnected');
      }
    }
    void check();
    const iv = window.setInterval(check, 5000);

    function onOnline() {
      void check();
    }
    function onOffline() {
      setStatus('disconnected');
    }
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      cancelled = true;
      window.clearInterval(iv);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [setStatus]);
}
