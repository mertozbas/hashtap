import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../cn.js';

const buttonStyles = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold whitespace-nowrap',
    'transition-all duration-normal ease-smooth',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    'focus-visible:outline-none focus-visible:ht-focus-ring',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-brand-500 hover:bg-brand-400 active:bg-brand-600',
          'text-white shadow-glow',
        ],
        secondary: ['ht-glass hover:bg-white/10 text-textc-primary'],
        tertiary: ['bg-transparent text-brand-500 hover:underline'],
        danger: ['bg-state-danger/90 hover:bg-state-danger text-white'],
      },
      size: {
        sm: ['h-10 px-4 text-sm rounded-md'],
        md: ['h-touch px-6 text-base rounded-lg'],
        lg: ['h-touch-lg px-8 text-lg rounded-xl'],
      },
      fullWidth: {
        true: ['w-full'],
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant, size, fullWidth, leftIcon, rightIcon, loading, disabled, children, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={rest.type ?? 'button'}
        className={cn(buttonStyles({ variant, size, fullWidth }), className)}
        disabled={disabled ?? loading}
        aria-busy={loading ? 'true' : undefined}
        {...rest}
      >
        {loading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading ? rightIcon : null}
      </button>
    );
  },
);
