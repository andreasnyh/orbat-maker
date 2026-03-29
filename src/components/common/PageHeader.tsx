import clsx from 'clsx';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  count?: number;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  count,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={clsx('flex items-center gap-3 flex-wrap', className)}>
      <h1 className="font-display text-xl font-bold text-strong uppercase tracking-wide">
        {title}
        {count != null && count > 0 && (
          <span className="ml-2 text-sm font-data text-dim font-normal normal-case tracking-normal">
            {count}
          </span>
        )}
      </h1>
      {children && (
        <div className="ml-auto flex items-center gap-3">{children}</div>
      )}
    </div>
  );
}
