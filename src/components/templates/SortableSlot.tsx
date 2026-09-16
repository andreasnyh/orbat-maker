import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Slot } from '../../types';
import { SlotEditor } from './SlotEditor';

interface SortableSlotProps {
  slot: Slot;
  groupId: string;
  onUpdate: (slot: Slot) => void;
  onDelete: () => void;
  equipmentSuggestions?: string[];
  isLast?: boolean;
}

export function SortableSlot({
  slot,
  groupId,
  onUpdate,
  onDelete,
  equipmentSuggestions,
  isLast,
}: SortableSlotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id, data: { type: 'slot', groupId } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    // `attributes` go on the handle, not here: they carry the tab stop and the
    // aria-describedby pointing at the drag instructions, and the keyboard
    // sensor listens on the element that holds `listeners`. Split across two
    // elements, focus lands somewhere the space bar does nothing.
    <div ref={setNodeRef} style={style}>
      <SlotEditor
        slot={slot}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={listeners}
        dragHandleAttributes={attributes}
        equipmentSuggestions={equipmentSuggestions}
        isLast={isLast}
      />
    </div>
  );
}
