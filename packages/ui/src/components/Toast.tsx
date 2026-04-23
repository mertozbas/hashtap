import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../cn.js';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
}

interface ToastContextValue {
  show: (toast: Omit<Toast, 'id'> & { id?: string }) => string;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const iconMap: Record<ToastTone, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toneClass: Record<ToastTone, string> = {
  success: 'text-state-success',
  error: 'text-state-danger',
  warning: 'text-state-warning',
  info: 'text-state-info',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = React.useCallback<ToastContextValue['show']>(
    (toast) => {
      const id = toast.id ?? `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const entry: Toast = { tone: 'info', duration: 4500, ...toast, id };
      setItems((list) => [...list, entry]);
      if (entry.duration && entry.duration > 0) {
        setTimeout(() => dismiss(id), entry.duration);
      }
      return id;
    },
    [dismiss],
  );

  const value = React.useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[9999] flex flex-col items-center gap-3 px-4">
        <AnimatePresence initial={false}>
          {items.map((toast) => {
            const tone = toast.tone ?? 'info';
            const Icon = iconMap[tone];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.95 }}
                transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
                className={cn(
                  'pointer-events-auto ht-card rounded-xl',
                  'flex max-w-md items-start gap-3 px-4 py-3',
                )}
              >
                <Icon className={cn('mt-0.5 h-5 w-5 flex-none', toneClass[tone])} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-textc-primary">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-0.5 text-sm text-textc-secondary">{toast.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Kapat"
                  onClick={() => dismiss(toast.id)}
                  className="rounded-md p-1 text-textc-muted hover:text-textc-primary hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a <ToastProvider>');
  return ctx;
}
