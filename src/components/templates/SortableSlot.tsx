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
}

export function SortableSlot({
  slot,
  groupId,
  onUpdate,
  onDelete,
  equipmentSuggestions,
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
    <div ref={setNodeRef} style={style} {...attributes}>
      <SlotEditor
        slot={slot}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={listeners}
        equipmentSuggestions={equipmentSuggestions}
      />
    </div>
  );
}
