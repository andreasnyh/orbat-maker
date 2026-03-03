import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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

export function GroupEditor({
  group,
  onUpdate,
  onDelete,
  dragHandleProps,
}: GroupEditorProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

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
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a4a] bg-[#15152a]">
          {/* Drag handle for the group */}
          <span
            className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0"
            {...dragHandleProps}
          >
            <GripVertical size={16} />
          </span>

          {/* Group name — inline editable */}
          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                ref={nameInputRef}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitGroupName}
                onKeyDown={handleNameKeyDown}
                className="w-full bg-[#0f0f23] border border-green-400/50 rounded px-2 py-0.5 text-sm font-semibold text-gray-200 focus:outline-none focus:ring-1 focus:ring-green-400/25"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="block w-full text-left text-sm font-semibold text-gray-200 cursor-text hover:text-white truncate bg-transparent border-none p-0"
                title="Click to edit group name"
              >
                {group.name}
              </button>
            )}
          </div>

          {/* Slot count */}
          <span className="flex-shrink-0 text-xs text-gray-500">
            {group.slots.length} {group.slots.length === 1 ? 'slot' : 'slots'}
          </span>

          {/* Delete group button */}
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors"
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
            <p className="text-xs text-gray-600 text-center py-2 italic">
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
