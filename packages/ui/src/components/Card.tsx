import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../cn.js';

const cardStyles = cva(
  [
    'ht-glass',
    'flex flex-col',
    'transition-shadow duration-normal ease-smooth',
  ],
  {
    variants: {
      padding: {
        none: ['p-0'],
        sm: ['p-4'],
        md: ['p-6'],
        lg: ['p-8'],
      },
      radius: {
        md: ['rounded-lg'],
        lg: ['rounded-xl'],
        xl: ['rounded-2xl'],
      },
      elevated: {
        true: ['shadow-glass'],
      },
      interactive: {
        true: ['cursor-pointer hover:border-white/20 hover:bg-white/[0.08]'],
      },
    },
    defaultVariants: {
      padding: 'md',
      radius: 'xl',
      elevated: true,
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardStyles> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, padding, radius, elevated, interactive, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(cardStyles({ padding, radius, elevated, interactive }), className)}
      {...rest}
    >
      {children}
    </div>
  );
});

export function CardHeader({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-start justify-between gap-4 mb-4', className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-xl font-semibold text-textc-primary', className)} {...rest} />;
}

export function CardDescription({
  className,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-textc-secondary', className)} {...rest} />;
}

export function CardContent({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex-1', className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-6 pt-4 border-t border-white/8 flex items-center justify-end gap-3', className)}
      {...rest}
    />
  );
}
