import * as React from 'react';
import { cn } from '../cn.js';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const roundedMap: Record<NonNullable<SkeletonProps['rounded']>, string> = {
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export function Skeleton({ className, rounded = 'md', ...rest }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden bg-white/6',
        roundedMap[rounded],
        'before:absolute before:inset-0',
        'before:-translate-x-full before:animate-[shimmer_1.6s_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        className,
      )}
      {...rest}
    />
  );
}
