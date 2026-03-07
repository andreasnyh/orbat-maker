import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Palette, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { generateId } from '../../lib/ids';
import type { Group, Slot } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { SlotEditor } from './SlotEditor';

interface GroupEditorProps {
  group: Group;
  onUpdate: (group: Group) => void;
  onDelete: () => void;
  // biome-ignore lint/suspicious/noExplicitAny: drag handle props from dnd-kit
  dragHandleProps?: Record<string, any>;
}

// ---- Sortable wrapper for each slot ----------------------------------------

interface SortableSlotProps {
  slot: Slot;
  onUpdate: (slot: Slot) => void;
  onDelete: () => void;
}

function SortableSlot({ slot, onUpdate, onDelete }: SortableSlotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <SlotEditor
        slot={slot}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  );
}

// ---- GroupEditor -------------------------------------------------------------

const GROUP_COLORS = [
  { value: undefined, label: 'Default' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Orange' },
  { value: '#ec4899', label: 'Pink' },
] as const;

export function GroupEditor({
  group,
  onUpdate,
  onDelete,
  dragHandleProps,
}: GroupEditorProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      colorPickerRef.current &&
      !colorPickerRef.current.contains(e.target as Node)
    ) {
      setShowColors(false);
    }
  }, []);

  useEffect(() => {
    if (showColors) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColors, handleClickOutside]);

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (!editingName) {
      setNameDraft(group.name);
    }
  }, [group.name, editingName]);

  function commitGroupName() {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== group.name) {
      onUpdate({ ...group, name: trimmed });
    } else {
      setNameDraft(group.name);
    }
    setEditingName(false);
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitGroupName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setNameDraft(group.name);
      setEditingName(false);
    }
  }

  function addSlot() {
    const newSlot: Slot = { id: generateId(), roleLabel: 'New Role' };
    onUpdate({ ...group, slots: [...group.slots, newSlot] });
  }

  function updateSlot(updated: Slot) {
    onUpdate({
      ...group,
      slots: group.slots.map((s) => (s.id === updated.id ? updated : s)),
    });
  }

  function deleteSlot(slotId: string) {
    onUpdate({ ...group, slots: group.slots.filter((s) => s.id !== slotId) });
  }

  function handleSlotDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = group.slots.findIndex((s) => s.id === active.id);
    const newIndex = group.slots.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onUpdate({ ...group, slots: arrayMove(group.slots, oldIndex, newIndex) });
  }

  return (
    <>
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg overflow-hidden">
        {/* Group header */}
        <div
          className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a4a] bg-[#15152a] border-l-2"
          style={{ borderLeftColor: group.color ?? 'transparent' }}
        >
          {/* Drag handle for the group */}
          <button
            type="button"
            className="text-gray-700 hover:text-gray-300 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
            aria-label={`Reorder ${group.name}`}
            {...dragHandleProps}
          >
            <GripVertical size={16} />
          </button>

          {/* Group name — inline editable */}
          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                ref={nameInputRef}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitGroupName}
                onKeyDown={handleNameKeyDown}
                aria-label="Group name"
                className="w-full bg-[#0f0f23] border border-green-400/50 rounded px-2 py-0.5 text-sm font-semibold text-gray-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-400/25"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="block w-full text-left font-display text-sm font-semibold text-gray-200 cursor-text hover:text-white truncate bg-transparent border-none p-0"
                title="Click to edit group name"
              >
                {group.name}
              </button>
            )}
          </div>

          {/* Slot count */}
          <span className="shrink-0 text-xs text-gray-400 font-data">
            {group.slots.length} {group.slots.length === 1 ? 'slot' : 'slots'}
          </span>

          {/* Color picker toggle */}
          <div ref={colorPickerRef} className="relative shrink-0">
            <button
              onClick={() => setShowColors((v) => !v)}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Set group color"
              title="Set group color"
              type="button"
            >
              {group.color ? (
                <span
                  className="block w-3.5 h-3.5 rounded-full border border-white/20"
                  style={{ backgroundColor: group.color }}
                />
              ) : (
                <Palette size={14} />
              )}
            </button>

            {showColors && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg p-2 shadow-xl">
                <div className="flex gap-1.5">
                  {GROUP_COLORS.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => {
                        onUpdate({ ...group, color: c.value });
                        setShowColors(false);
                      }}
                      className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-125 ${
                        group.color === c.value
                          ? 'border-white scale-110'
                          : 'border-transparent'
                      }`}
                      style={{
                        backgroundColor: c.value ?? '#4b5563',
                      }}
                      title={c.label}
                      aria-label={`Color: ${c.label}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Delete group button */}
          <button
            onClick={() => setConfirmDelete(true)}
            className="shrink-0 text-gray-500 hover:text-red-400 transition-colors"
            aria-label={`Delete ${group.name}`}
            title="Delete group"
            type="button"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Slots list */}
        <div className="px-1 py-1">
          {group.slots.length > 0 ? (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleSlotDragEnd}
            >
              <SortableContext
                items={group.slots.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {group.slots.map((slot) => (
                  <SortableSlot
                    key={slot.id}
                    slot={slot}
                    onUpdate={updateSlot}
                    onDelete={() => deleteSlot(slot.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2 italic">
              No slots — add one below
            </p>
          )}
        </div>

        {/* Add slot button */}
        <div className="px-3 py-2 border-t border-[#2a2a4a]">
          <button
            onClick={addSlot}
            type="button"
            className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors"
          >
            <Plus size={12} />
            Add Slot
          </button>
        </div>
      </div>

      {/* Confirm group deletion */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={onDelete}
        title="Delete Group"
        message={`Delete "${group.name}" and all its slots? This cannot be undone.`}
        confirmLabel="Delete Group"
      />
    </>
  );
}
