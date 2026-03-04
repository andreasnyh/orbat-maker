import { useDraggable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useOrbatsState } from '../../context/AppStateContext';
import type { Assignment, Person, Slot } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EquipmentPills } from '../common/EquipmentPills';

interface OrbatSlotProps {
  slot: Slot;
  assignment: Assignment | undefined;
  person: Person | undefined;
  orbatId: string;
  onRemoveSlot?: (slotId: string) => void;
  onUpdateEquipment?: (slotId: string, equipment: string[]) => void;
  equipmentSuggestions?: string[];
  showEquipment?: boolean;
}

export function OrbatSlot({
  slot,
  assignment,
  person,
  orbatId,
  onRemoveSlot,
  onUpdateEquipment,
  equipmentSuggestions,
  showEquipment,
}: OrbatSlotProps) {
  const { unassignSlot } = useOrbatsState();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [equipPopoverOpen, setEquipPopoverOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Sortable — also acts as the droppable target for person drops.
  // The outer DndContext reads `slotId` from `over.data.current` for both
  // person-assignment and slot-reorder drag types.
  const {
    attributes: sortableAttrs,
    listeners: sortableListeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isSortDragging,
    isOver,
  } = useSortable({
    id: `sort-${slot.id}`,
    data: { type: 'slot-reorder', slotId: slot.id },
  });

  // Draggable (for dragging assigned person out of this slot)
  const {
    setNodeRef: setDragRef,
    attributes: dragAttrs,
    listeners: dragListeners,
    isDragging: isPersonDragging,
  } = useDraggable({
    id: `slot-${slot.id}`,
    data: {
      type: 'person',
      personId: assignment?.personId,
      sourceSlotId: slot.id,
    },
    disabled: !assignment,
  });

  const isDragging = isSortDragging || isPersonDragging;

  function handleUnassign(e: React.MouseEvent) {
    e.stopPropagation();
    unassignSlot(orbatId, slot.id);
  }

  function handleRemoveSlot(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmRemove(true);
  }

  // Click-outside to close equipment popover
  useEffect(() => {
    if (!equipPopoverOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setEquipPopoverOpen(false);
        setNewTag('');
      }
    }
    document.addEventListener('pointerdown', onClickOutside);
    return () => document.removeEventListener('pointerdown', onClickOutside);
  }, [equipPopoverOpen]);

  // Auto-focus tag input when popover opens
  useEffect(() => {
    if (equipPopoverOpen) tagInputRef.current?.focus();
  }, [equipPopoverOpen]);

  function handleRemoveEquipment(tag: string) {
    onUpdateEquipment?.(
      slot.id,
      (slot.equipment ?? []).filter((t) => t !== tag),
    );
  }

  function handleAddEquipment(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed) return;
    const current = slot.equipment ?? [];
    if (current.includes(trimmed)) return;
    onUpdateEquipment?.(slot.id, [...current, trimmed]);
  }

  const sortableStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setSortableRef} style={sortableStyle}>
      <div
        className={clsx(
          'group/slot flex items-center gap-2 px-2 py-2.5 rounded-md border transition-all duration-150',
          isDragging
            ? 'opacity-40'
            : isOver
              ? 'border-green-400 border-dashed bg-green-400/5'
              : assignment
                ? 'border-[#2a2a4a] bg-[#16213e] hover:border-[#3a3a5a] hover:bg-[#1a2744]'
                : 'border-[#2a2a4a] border-dashed bg-[#0f0f23]/50 hover:border-[#3a3a5a] hover:bg-[#0f0f23]/80',
        )}
      >
        {/* Slot reorder zone: grip + role label */}
        <div
          className="flex items-center gap-2 shrink-0 cursor-grab active:cursor-grabbing rounded-sm transition-colors -ml-0.5 pl-0.5 pr-1 -my-0.5 py-0.5"
          title="Drag to reorder slot"
          {...sortableAttrs}
          {...sortableListeners}
        >
          <GripVertical
            size={14}
            className="text-gray-700 group-hover/slot:text-gray-500 shrink-0 transition-colors"
          />
          <span
            className="font-data text-sm text-gray-500 w-44 shrink-0 truncate"
            title={slot.roleLabel}
          >
            {slot.roleLabel}
          </span>
        </div>

        {/* Divider */}
        <span className="text-gray-700 shrink-0">—</span>

        {/* Person drag zone */}
        <span
          ref={setDragRef}
          className={clsx(
            'flex-1 min-w-0 flex items-center gap-1.5 rounded-sm px-1.5 -mx-0.5 -my-0.5 py-0.5 transition-colors',
            person
              ? 'font-display text-lg text-gray-200 font-medium cursor-grab active:cursor-grabbing hover:bg-white/5'
              : 'text-sm text-gray-600 italic font-data',
          )}
          title={person ? 'Drag to reassign' : undefined}
          {...dragAttrs}
          {...dragListeners}
        >
          {person ? (
            <>
              <GripVertical size={14} className="text-gray-700 shrink-0" />
              {person.rank && (
                <span className="text-green-400 text-sm font-normal font-data">
                  {person.rank}
                </span>
              )}
              <span className="truncate pb-px">{person.name}</span>
            </>
          ) : (
            <>
              <span className="w-3.5 shrink-0" />
              [EMPTY]
            </>
          )}
        </span>

        {/* Equipment pills */}
        {showEquipment && (
          <div className="flex items-center gap-1 shrink-0 relative">
            <EquipmentPills
              equipment={slot.equipment ?? []}
              onRemove={onUpdateEquipment ? handleRemoveEquipment : undefined}
            />
            {onUpdateEquipment && (
              <>
                <button
                  type="button"
                  className="text-amber-400/50 hover:text-amber-300 transition-colors p-0.5 rounded"
                  aria-label="Add equipment"
                  title="Add equipment"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEquipPopoverOpen((v) => !v);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Plus size={12} />
                </button>
                {equipPopoverOpen && (
                  <div
                    ref={popoverRef}
                    className="absolute right-0 top-full mt-1 z-50 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg shadow-xl p-2 min-w-[200px]"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {/* Suggestion chips */}
                    {equipmentSuggestions &&
                      equipmentSuggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 max-h-40 overflow-y-auto">
                          {equipmentSuggestions
                            .filter((s) => !(slot.equipment ?? []).includes(s))
                            .map((s) => (
                              <button
                                key={s}
                                type="button"
                                className="bg-amber-400/10 text-amber-300/80 hover:bg-amber-400/25 text-[10px] font-mono rounded-full px-2 py-0.5 transition-colors"
                                onClick={() => handleAddEquipment(s)}
                              >
                                {s}
                              </button>
                            ))}
                        </div>
                      )}
                    {/* Custom tag input */}
                    <input
                      ref={tagInputRef}
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddEquipment(newTag);
                          setNewTag('');
                        }
                        if (e.key === 'Escape') {
                          setEquipPopoverOpen(false);
                          setNewTag('');
                        }
                      }}
                      placeholder="New tag…"
                      aria-label="New equipment tag"
                      className="w-full bg-[#0f0f23] border border-[#2a2a4a] rounded px-2 py-1 text-[11px] text-gray-200 placeholder-gray-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/25 font-mono"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Unassign button */}
        {assignment && (
          <button
            type="button"
            onClick={handleUnassign}
            onPointerDown={(e) => e.stopPropagation()}
            className="shrink-0 text-gray-600 hover:text-red-400 transition-colors p-0.5 rounded"
            aria-label={`Remove ${person?.name ?? 'person'} from ${slot.roleLabel}`}
            title="Remove assignment"
          >
            <X size={14} />
          </button>
        )}

        {/* Remove slot button */}
        {onRemoveSlot && (
          <button
            type="button"
            onClick={handleRemoveSlot}
            onPointerDown={(e) => e.stopPropagation()}
            className="shrink-0 text-gray-700 hover:text-red-400 transition-colors p-0.5 rounded"
            aria-label={`Delete ${slot.roleLabel} slot`}
            title="Delete slot"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        title={`Delete "${slot.roleLabel}" slot?`}
        message="This will permanently remove the slot from this group."
        confirmLabel="Delete"
        onConfirm={() => onRemoveSlot?.(slot.id)}
        onClose={() => setConfirmRemove(false)}
      />
    </div>
  );
}
