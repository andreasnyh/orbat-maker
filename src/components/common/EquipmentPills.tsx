import clsx from 'clsx';
import { Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useFocusWhen } from '../../hooks/useFocusWhen';
import { useToggle } from '../../hooks/useToggle';

interface EquipmentPillsProps {
  equipment: string[];
  onAdd?: (tag: string) => void;
  onRemove?: (tag: string) => void;
  suggestions?: string[];
}

export function EquipmentPills({
  equipment,
  onAdd,
  onRemove,
  suggestions,
}: EquipmentPillsProps) {
  const [popoverOpen, togglePopoverOpen, setPopoverOpen] = useToggle();
  const [newTag, setNewTag] = useState('');
  const [popoverAbove, setPopoverAbove] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useFocusWhen(tagInputRef, popoverOpen);

  function closePopover() {
    setPopoverOpen(false);
    setNewTag('');
  }

  function handleAdd(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !equipment.includes(trimmed)) onAdd?.(trimmed);
  }

  const unusedSuggestions = suggestions?.filter((s) => !equipment.includes(s));

  return (
    <>
      {equipment.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-0.5 bg-equip-bg text-equip text-[10px] font-mono rounded px-1.5 py-[3px]"
        >
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
      {onAdd && (
        <>
          <button
            ref={addBtnRef}
            type="button"
            className="text-equip-muted hover:text-equip transition-colors p-2 md:p-1 rounded"
            aria-label="Add equipment"
            title="Add equipment"
            onClick={(e) => {
              e.stopPropagation();
              if (!popoverOpen && addBtnRef.current) {
                const rect = addBtnRef.current.getBoundingClientRect();
                setPopoverAbove(rect.bottom > window.innerHeight * 0.6);
              }
              togglePopoverOpen();
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Plus className="size-5 md:size-4" />
          </button>
          {popoverOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={closePopover}
                onPointerDown={(e) => e.stopPropagation()}
                aria-hidden="true"
              />
              <div
                className={clsx(
                  'absolute right-0 z-50 bg-panel border border-trim rounded-lg shadow-xl p-2 min-w-[200px]',
                  popoverAbove ? 'bottom-full mb-1' : 'top-full mt-1',
                )}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {unusedSuggestions && unusedSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2 max-h-40 overflow-y-auto">
                    {unusedSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="bg-equip-bg text-equip hover:brightness-125 text-[10px] font-mono rounded px-2 py-[3px] transition-colors"
                        onClick={() => handleAdd(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  ref={tagInputRef}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAdd(newTag);
                      setNewTag('');
                    }
                    if (e.key === 'Escape') closePopover();
                  }}
                  placeholder="New tag…"
                  aria-label="New equipment tag"
                  className="w-full bg-page border border-trim rounded px-2 py-1 text-[11px] text-body placeholder-faint focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-equip/25 font-mono"
                />
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
