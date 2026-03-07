import clsx from 'clsx';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  size = 'sm',
  className,
}: ToggleProps) {
  return (
    <label
      className={clsx(
        'flex items-center cursor-pointer select-none group',
        size === 'sm' ? 'gap-1.5' : 'gap-2',
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span
        aria-hidden="true"
        className={clsx(
          'relative rounded-full transition-colors border shrink-0',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-green-400/60 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-[#1a1a2e]',
          size === 'sm' ? 'w-6 h-3.5' : 'w-8 h-4.5',
          checked
            ? 'bg-green-600 border-green-500'
            : 'bg-[#0f0f23] border-[#2a2a4a]',
        )}
      >
        <span
          className={clsx(
            'absolute rounded-full bg-white transition-transform',
            size === 'sm' ? 'top-[3px] w-2 h-2' : 'top-0.5 w-3 h-3',
            checked
              ? size === 'sm'
                ? 'translate-x-3'
                : 'translate-x-4'
              : 'translate-x-0.5',
          )}
        />
      </span>
      <span
        className={clsx(
          'text-gray-400 group-hover:text-gray-300 transition-colors',
          size === 'sm' ? 'text-[11px]' : 'text-xs',
        )}
      >
        {label}
      </span>
    </label>
  );
}
