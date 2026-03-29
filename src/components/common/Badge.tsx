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
          'bg-amber-400/15 text-amber-400': variant === 'amber',
          'bg-indigo-400/15 text-indigo-400': variant === 'indigo',
        },
      )}
    >
      {children}
    </span>
  );
}
