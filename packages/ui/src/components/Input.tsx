import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../cn.js';

const inputStyles = cva(
  [
    'w-full ht-glass',
    'text-base text-textc-primary placeholder:text-textc-muted',
    'border rounded-lg px-4',
    'transition-all duration-fast ease-smooth',
    'focus-visible:outline-none focus-visible:border-brand-500 focus-visible:shadow-glow',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      size: {
        md: ['h-touch'],
        lg: ['h-touch-lg'],
      },
      invalid: {
        true: ['border-state-danger/70 focus-visible:border-state-danger'],
        false: ['border-white/14'],
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
  },
);

type InputElementProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>;

export interface InputProps extends InputElementProps, VariantProps<typeof inputStyles> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, size, invalid, id, ...rest },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  const showError = Boolean(error);
  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-textc-secondary"
        >
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={showError || undefined}
        aria-describedby={
          showError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        className={cn(inputStyles({ size, invalid: showError || invalid }), className)}
        {...rest}
      />
      {showError ? (
        <p id={`${inputId}-error`} className="text-sm text-state-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-sm text-textc-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
