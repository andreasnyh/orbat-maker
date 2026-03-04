import { Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface EquipmentPillsProps {
  equipment: string[];
  onAdd?: (tag: string) => void;
  onRemove?: (tag: string) => void;
  /** Pill size variant */
  size?: 'sm' | 'md';
}

export function EquipmentPills({
  equipment,
  onAdd,
  onRemove,
  size = 'sm',
}: EquipmentPillsProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  function commitTag() {
    const trimmed = draft.trim();
    if (trimmed) onAdd?.(trimmed);
    setDraft('');
    setAdding(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitTag();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setDraft('');
      setAdding(false);
    }
  }

  const pillClass =
    size === 'sm'
      ? 'inline-flex items-center gap-0.5 bg-amber-400/15 text-amber-300 text-[10px] font-mono rounded-full px-1.5 py-[3px]'
      : 'inline-flex items-center gap-0.5 bg-amber-400/15 text-amber-300 text-[10px] font-mono rounded-full px-2 py-[3px]';

  return (
    <>
      {equipment.map((tag) => (
        <span key={tag} className={pillClass}>
          <span className="translate-y-px">{tag}</span>
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(tag);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="hover:text-red-400 transition-colors ml-0.5"
              aria-label={`Remove ${tag}`}
            >
              <X size={10} />
            </button>
          )}
        </span>
      ))}
      {onAdd &&
        (adding ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitTag}
            onKeyDown={handleKeyDown}
            placeholder="Tag…"
            className="bg-[#0f0f23] border border-amber-400/30 rounded-full px-2 py-0.5 text-[10px] font-mono text-gray-200 w-20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/25"
          />
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAdding(true);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 text-[10px] text-amber-400/50 hover:text-amber-400 transition-colors"
            title="Add equipment tag"
          >
            <Plus size={10} />
          </button>
        ))}
    </>
  );
}
