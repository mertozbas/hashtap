import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../cn.js';

const badgeStyles = cva(
  [
    'inline-flex items-center gap-1.5',
    'px-3 py-1 rounded-full',
    'text-xs font-semibold uppercase tracking-wide',
  ],
  {
    variants: {
      tone: {
        neutral: ['bg-white/10 text-textc-primary'],
        brand: ['bg-brand-500/15 text-brand-400'],
        success: ['bg-state-success/15 text-state-success'],
        warning: ['bg-state-warning/15 text-state-warning'],
        danger: ['bg-state-danger/15 text-state-danger'],
        info: ['bg-state-info/15 text-state-info'],
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeStyles> {
  dot?: boolean;
  pulsing?: boolean;
}

export function Badge({ className, tone, dot, pulsing, children, ...rest }: BadgeProps) {
  return (
    <span className={cn(badgeStyles({ tone }), className)} {...rest}>
      {dot ? (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full bg-current',
            pulsing ? 'animate-pulse' : undefined,
          )}
        />
      ) : null}
      {children}
    </span>
  );
}
