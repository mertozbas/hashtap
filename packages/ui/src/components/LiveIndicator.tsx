import * as React from 'react';
import { cn } from '../cn.js';

export type LiveStatus = 'connected' | 'connecting' | 'disconnected';

export interface LiveIndicatorProps {
  status: LiveStatus;
  label?: string;
  className?: string;
}

const statusMap: Record<LiveStatus, { color: string; label: string; pulse: boolean }> = {
  connected: { color: 'bg-state-success', label: 'Canlı', pulse: true },
  connecting: { color: 'bg-state-warning', label: 'Bağlanıyor', pulse: true },
  disconnected: { color: 'bg-state-danger', label: 'Bağlantı kopuk', pulse: false },
};

export function LiveIndicator({ status, label, className }: LiveIndicatorProps) {
  const cfg = statusMap[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1',
        'text-xs font-medium text-textc-secondary ht-glass',
        className,
      )}
      aria-live="polite"
    >
      <span className="relative inline-flex h-2 w-2">
        <span className={cn('inline-flex h-2 w-2 rounded-full', cfg.color)} />
        {cfg.pulse ? (
          <span
            className={cn(
              'absolute inset-0 rounded-full opacity-75 animate-ping',
              cfg.color,
            )}
          />
        ) : null}
      </span>
      <span>{label ?? cfg.label}</span>
    </span>
  );
}
