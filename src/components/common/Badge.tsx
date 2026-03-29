import clsx from 'clsx';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'green' | 'yellow' | 'amber' | 'indigo';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-data font-medium',
        {
          'bg-trim text-sub': variant === 'default',
          'bg-success-dim text-success': variant === 'green',
          'bg-warning-dim text-warning': variant === 'yellow',
          'bg-caution-dim text-caution': variant === 'amber',
          'bg-accent/15 text-accent': variant === 'indigo',
        },
      )}
    >
      {children}
    </span>
  );
}
