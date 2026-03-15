import clsx from 'clsx';
import { type Ref, type SelectHTMLAttributes, useId } from 'react';
import { inputBaseClass } from './TextInput';

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  ref?: Ref<HTMLSelectElement>;
}

export function SelectInput({
  label,
  className,
  id,
  ref,
  children,
  ...props
}: SelectInputProps) {
  const reactId = useId();
  const selectId = id || reactId;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm text-dim">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          inputBaseClass,
          'appearance-none bg-no-repeat bg-[length:16px] bg-[right_0.5rem_center] bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")] pr-8',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
