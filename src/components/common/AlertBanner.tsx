import clsx from 'clsx';
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

interface AlertBannerProps {
  variant: 'warning' | 'danger' | 'caution';
  children: ReactNode;
  icon?: boolean;
  className?: string;
}

const variantClasses = {
  warning: 'bg-warning-dim border-warning/30 text-warning',
  danger: 'bg-danger-dim border-danger/30 text-danger',
  caution: 'bg-caution-dim border-caution/30 text-caution',
};

export function AlertBanner({
  variant,
  children,
  icon = true,
  className,
}: AlertBannerProps) {
  return (
    <div
      className={clsx(
        'flex items-start gap-2 border rounded-lg p-3 text-sm',
        variantClasses[variant],
        className,
      )}
    >
      {icon && (
        <AlertTriangle
          size={16}
          className="shrink-0 mt-0.5"
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </div>
  );
}
