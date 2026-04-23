import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../cn.js';
import { Button } from './Button.js';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  dismissible?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissible = true,
  size = 'md',
  className,
}: ModalProps) {
  React.useEffect(() => {
    if (!open || !dismissible) return;
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismissible, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.1 }}
            onClick={dismissible ? onClose : undefined}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              'relative w-full ht-card rounded-2xl',
              sizeMap[size],
              className,
            )}
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1 },
            }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {dismissible ? (
              <Button
                variant="secondary"
                size="sm"
                aria-label="Kapat"
                onClick={onClose}
                className="absolute right-4 top-4 h-touch w-touch !p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            ) : null}
            {title ? (
              <h2 className="text-2xl font-semibold text-textc-primary pr-14">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-2 text-sm text-textc-secondary">{description}</p>
            ) : null}
            {children ? <div className="mt-6">{children}</div> : null}
            {footer ? (
              <div className="mt-8 flex flex-wrap items-center justify-end gap-3">{footer}</div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
