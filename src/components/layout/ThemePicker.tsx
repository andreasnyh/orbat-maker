import { Palette } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Theme } from '../../hooks/useTheme';

const THEMES: { id: Theme; label: string; dot: string }[] = [
  { id: 'midnight', label: 'Midnight', dot: '#4ade80' },
  { id: 'olive', label: 'Olive', dot: '#a3be8c' },
  { id: 'sand', label: 'Sand', dot: '#a34d08' },
];

interface ThemePickerProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export function ThemePicker({ theme, setTheme }: ThemePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const currentDot = THEMES.find((t) => t.id === theme)?.dot ?? THEMES[0].dot;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-2 rounded-md text-dim hover:text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        aria-label="Change theme"
        title="Change theme"
      >
        <Palette size={16} />
        <span
          className="block w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: currentDot }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-panel border border-trim rounded-md shadow-xl z-50 py-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors hover:bg-overlay ${
                theme === t.id
                  ? 'text-accent font-medium'
                  : 'text-dim hover:text-body'
              }`}
            >
              <span
                className="block w-3 h-3 rounded-full border border-trim"
                style={{ backgroundColor: t.dot }}
              />
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
