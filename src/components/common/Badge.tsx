import clsx from 'clsx';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'green' | 'yellow';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        {
          'bg-[#2a2a4a] text-gray-300': variant === 'default',
          'bg-green-400/15 text-green-400': variant === 'green',
          'bg-yellow-400/15 text-yellow-400': variant === 'yellow',
        },
      )}
    >
      {children}
    </span>
  );
}
