import type { ElementType, ReactNode } from 'react';

interface EmptyStateProps {
  icon: ElementType;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Icon size={48} className="text-faint" />
      <div className="flex flex-col gap-1">
        <p className="text-sub font-medium">{title}</p>
        {description && (
          <p className="text-dim text-sm max-w-xs">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
