import { type InputHTMLAttributes, type Ref, useId } from 'react'
import clsx from 'clsx'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  ref?: Ref<HTMLInputElement>
}

export function TextInput({ label, className, id, ref, ...props }: TextInputProps) {
  const reactId = useId()
  const inputId = id || reactId
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm text-gray-400">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'bg-[#0f0f23] border border-[#2a2a4a] rounded-md px-3 py-2 text-gray-200 text-sm',
          'placeholder:text-gray-600 focus:outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/25',
          className,
        )}
        {...props}
      />
    </div>
  )
}
