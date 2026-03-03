import { GripVertical, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Slot } from '../../types';

interface SlotEditorProps {
  slot: Slot;
  onUpdate: (slot: Slot) => void;
  onDelete: () => void;
  // biome-ignore lint/suspicious/noExplicitAny: drag handle props from dnd-kit
  dragHandleProps?: Record<string, any>;
}

export function SlotEditor({
  slot,
  onUpdate,
  onDelete,
  dragHandleProps,
}: SlotEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(slot.roleLabel);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  // Keep draft in sync if the slot changes from outside (e.g. parent reorders)
  useEffect(() => {
    if (!editing) {
      setDraft(slot.roleLabel);
    }
  }, [slot.roleLabel, editing]);

  function commitEdit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== slot.roleLabel) {
      onUpdate({ ...slot, roleLabel: trimmed });
    } else {
      setDraft(slot.roleLabel);
    }
    setEditing(false);
  }

  function cancelEdit() {
    setDraft(slot.roleLabel);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 group">
      {/* Drag handle */}
      <span
        className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0"
        role="button"
        tabIndex={0}
        aria-label={`Reorder ${slot.roleLabel}`}
        {...dragHandleProps}
      >
        <GripVertical size={14} />
      </span>

      {/* Role label — inline editable */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            aria-label="Role label"
            className="w-full bg-[#0f0f23] border border-green-400/50 rounded px-2 py-0.5 text-sm font-mono text-gray-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-400/25"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="block w-full text-left font-mono text-sm text-gray-300 cursor-text hover:text-gray-100 truncate bg-transparent border-none p-0"
            title="Click to edit"
          >
            {slot.roleLabel}
          </button>
        )}
      </div>

      {/* Delete button — always visible on hover */}
      <button
        onClick={onDelete}
        className="shrink-0 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        aria-label={`Remove ${slot.roleLabel}`}
        title="Remove slot"
        type="button"
      >
        <X size={14} />
      </button>
    </div>
  );
}
