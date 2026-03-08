import clsx from 'clsx';
import { type InputHTMLAttributes, type Ref, useId } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  ref?: Ref<HTMLInputElement>;
}

export function TextInput({
  label,
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
          'bg-page border border-trim rounded-md px-3 py-2 text-body text-sm',
          'placeholder:text-faint focus-visible:outline-none focus-visible:border-accent/50 focus-visible:ring-1 focus-visible:ring-accent/25',
          className,
        )}
        {...props}
      />
    </div>
  );
}
