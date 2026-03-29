import clsx from 'clsx';
import { type InputHTMLAttributes, type Ref, useId } from 'react';

export const inputBaseClass =
  'bg-page border border-trim rounded-md px-3 py-2 text-body text-sm placeholder:text-faint focus-visible:outline-none focus-visible:border-accent/50 focus-visible:ring-1 focus-visible:ring-accent/25';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

export function TextInput({
  label,
  error,
  className,
  id,
  ref,
  ...props
}: TextInputProps) {
  const reactId = useId();
  const inputId = id || reactId;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm text-dim">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          inputBaseClass,
          error &&
            'border-red-500/50 focus-visible:border-red-500/50 focus-visible:ring-red-500/25',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
