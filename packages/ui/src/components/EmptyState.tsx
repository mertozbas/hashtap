import * as React from 'react';
import { cn } from '../cn.js';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-16 px-8 gap-4',
        className,
      )}
    >
      {icon ? (
        <div className="text-textc-muted/40 [&_svg]:h-24 [&_svg]:w-24" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h3 className="text-2xl font-semibold text-textc-primary">{title}</h3>
      {description ? (
        <p className="max-w-md text-base text-textc-secondary">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
