import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-green-600 text-white hover:bg-green-500': variant === 'primary',
          'bg-[#2a2a4a] text-gray-200 hover:bg-[#3a3a5a]':
            variant === 'secondary',
          'bg-red-600/20 text-red-400 hover:bg-red-600/30':
            variant === 'danger',
          'text-gray-400 hover:text-gray-200 hover:bg-white/5':
            variant === 'ghost',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
