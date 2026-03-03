import { GripVertical, Plus, X } from 'lucide-react';
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
  const [equipmentDraft, setEquipmentDraft] = useState('');
  const [addingEquipment, setAddingEquipment] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const equipmentInputRef = useRef<HTMLInputElement>(null);

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

  function addEquipmentTag() {
    const trimmed = equipmentDraft.trim();
    if (trimmed) {
      const current = slot.equipment ?? [];
      if (!current.includes(trimmed)) {
        onUpdate({ ...slot, equipment: [...current, trimmed] });
      }
    }
    setEquipmentDraft('');
    setAddingEquipment(false);
  }

  function removeEquipmentTag(tag: string) {
    const updated = (slot.equipment ?? []).filter((t) => t !== tag);
    onUpdate({ ...slot, equipment: updated.length > 0 ? updated : undefined });
  }

  function handleEquipmentKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEquipmentTag();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEquipmentDraft('');
      setAddingEquipment(false);
    }
  }

  useEffect(() => {
    if (addingEquipment) equipmentInputRef.current?.focus();
  }, [addingEquipment]);

  return (
    <div className="px-2 py-1.5 rounded hover:bg-white/5 group">
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <button
          type="button"
          className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0"
          aria-label={`Reorder ${slot.roleLabel}`}
          {...dragHandleProps}
        >
          <GripVertical size={14} />
        </button>

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

      {/* Equipment pills */}
      <div className="flex items-center gap-1.5 mt-1 ml-6 flex-wrap">
        {(slot.equipment ?? []).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-0.5 bg-amber-400/15 text-amber-300 text-[10px] font-mono rounded-full px-2 py-0.5"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeEquipmentTag(tag)}
              className="hover:text-red-400 transition-colors ml-0.5"
              aria-label={`Remove ${tag}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        {addingEquipment ? (
          <input
            ref={equipmentInputRef}
            value={equipmentDraft}
            onChange={(e) => setEquipmentDraft(e.target.value)}
            onBlur={addEquipmentTag}
            onKeyDown={handleEquipmentKeyDown}
            placeholder="Tag…"
            className="bg-[#0f0f23] border border-amber-400/30 rounded-full px-2 py-0.5 text-[10px] font-mono text-gray-200 w-20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/25"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingEquipment(true)}
            className="inline-flex items-center gap-0.5 text-[10px] text-amber-400/50 hover:text-amber-400 transition-colors"
            title="Add equipment tag"
          >
            <Plus size={10} />
          </button>
        )}
      </div>
    </div>
  );
}
