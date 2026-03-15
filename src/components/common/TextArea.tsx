import clsx from 'clsx';
import { type Ref, type TextareaHTMLAttributes, useId } from 'react';
import { inputBaseClass } from './TextInput';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

export function TextArea({
  label,
  className,
  id,
  ref,
  ...props
}: TextAreaProps) {
  const reactId = useId();
  const textareaId = id || reactId;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="text-sm text-dim">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={clsx(inputBaseClass, className)}
        {...props}
      />
    </div>
  );
}
