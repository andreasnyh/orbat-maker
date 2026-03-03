import { useDraggable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { GripVertical, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useOrbatsState } from '../../context/AppStateContext';
import type { Assignment, Person, Slot } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface OrbatSlotProps {
  slot: Slot;
  assignment: Assignment | undefined;
  person: Person | undefined;
  orbatId: string;
  onRemoveSlot?: (slotId: string) => void;
  showEquipment?: boolean;
}

export function OrbatSlot({
  slot,
  assignment,
  person,
  orbatId,
  onRemoveSlot,
  showEquipment,
}: OrbatSlotProps) {
  const { unassignSlot } = useOrbatsState();
  const [confirmRemove, setConfirmRemove] = useState(false);

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

  const sortableStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setSortableRef} style={sortableStyle}>
      <div
        ref={setDragRef}
        className={clsx(
          'flex items-center gap-2 px-2 py-2.5 rounded-md border transition-all',
          isDragging
            ? 'opacity-40'
            : isOver
              ? 'border-green-400 border-dashed bg-green-400/5'
              : assignment
                ? 'border-[#2a2a4a] bg-[#16213e]'
                : 'border-[#2a2a4a] border-dashed bg-[#0f0f23]/50',
          assignment && !isDragging && 'cursor-grab active:cursor-grabbing',
        )}
        {...dragAttrs}
        {...dragListeners}
      >
        {/* Grip handle for reordering */}
        <button
          type="button"
          className="text-gray-700 hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0"
          aria-label={`Reorder ${slot.roleLabel}`}
          {...sortableAttrs}
          {...sortableListeners}
          onPointerDown={(e) => {
            e.stopPropagation();
            sortableListeners?.onPointerDown?.(e as unknown as PointerEvent);
          }}
        >
          <GripVertical size={14} />
        </button>

        {/* Role label */}
        <span
          className="font-data text-sm text-gray-500 w-44 shrink-0 truncate"
          title={slot.roleLabel}
        >
          {slot.roleLabel}
        </span>

        {/* Divider */}
        <span className="text-gray-700 shrink-0">—</span>

        {/* Assigned person or empty indicator */}
        <span
          className={clsx(
            'flex-1 truncate',
            person
              ? 'font-display text-lg text-gray-200 font-medium'
              : 'text-sm text-gray-600 italic font-data',
          )}
        >
          {person ? (
            <>
              {person.rank && (
                <span className="text-green-400 text-xs font-normal font-data mr-1">
                  {person.rank}
                </span>
              )}
              {person.name}
            </>
          ) : (
            '[EMPTY]'
          )}
        </span>

        {/* Equipment pills */}
        {showEquipment && slot.equipment && slot.equipment.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {slot.equipment.map((tag) => (
              <span
                key={tag}
                className="inline-block bg-amber-400/15 text-amber-300 text-[10px] font-mono rounded-full px-1.5 py-px"
              >
                {tag}
              </span>
            ))}
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
