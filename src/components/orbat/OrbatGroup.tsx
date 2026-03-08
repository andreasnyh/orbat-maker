import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Assignment, Group, Person, Slot } from '../../types';
import { OrbatSlot } from './OrbatSlot';

interface OrbatGroupProps {
  group: Group;
  assignmentsBySlotId: Map<string, Assignment>;
  personById: Map<string, Person>;
  onAddSlot?: (groupId: string, roleLabel: string) => void;
  onRemoveSlot?: (groupId: string, slotId: string) => void;
  onUpdateSlot?: (
    groupId: string,
    slotId: string,
    updates: Partial<Omit<Slot, 'id'>>,
  ) => void;
  onUnassign?: (slotId: string) => void;
  equipmentSuggestions?: string[];
  showEquipment?: boolean;
  onTapAssign?: (slotId: string) => void;
  highlightSlotId?: string | null;
}

export const OrbatGroup = memo(function OrbatGroup({
  group,
  assignmentsBySlotId,
  personById,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
  onUnassign,
  equipmentSuggestions,
  showEquipment,
  onTapAssign,
  highlightSlotId,
}: OrbatGroupProps) {
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `group-${group.id}`,
    data: { type: 'slot-reorder', groupId: group.id },
  });

  const [addingSlot, setAddingSlot] = useState(false);
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filledCount = useMemo(
    () => group.slots.filter((slot) => assignmentsBySlotId.has(slot.id)).length,
    [group.slots, assignmentsBySlotId],
  );

  useEffect(() => {
    if (addingSlot) inputRef.current?.focus();
  }, [addingSlot]);

  function commitNewSlot() {
    const trimmed = newRoleLabel.trim();
    if (trimmed && onAddSlot) {
      onAddSlot(group.id, trimmed);
    }
    setNewRoleLabel('');
    setAddingSlot(false);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitNewSlot();
    if (e.key === 'Escape') {
      setNewRoleLabel('');
      setAddingSlot(false);
    }
  }

  const handleRemoveSlot = useCallback(
    (slotId: string) => {
      onRemoveSlot?.(group.id, slotId);
    },
    [onRemoveSlot, group.id],
  );

  const handleUpdateEquipment = useCallback(
    (slotId: string, equipment: string[]) => {
      onUpdateSlot?.(group.id, slotId, { equipment });
    },
    [onUpdateSlot, group.id],
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Group header */}
      <div
        className="flex items-center justify-between py-2 px-2 border-b border-trim border-l-2 rounded-sm bg-overlay"
        style={{
          borderLeftColor: group.color ?? 'rgb(34 197 94 / 0.5)',
        }}
      >
        <h3 className="font-display text-sm font-bold text-sub uppercase">
          {group.name}
        </h3>
        <span className="text-xs text-dim font-data">
          {filledCount}/{group.slots.length}
        </span>
      </div>

      {/* Slots */}
      <div ref={setDroppableRef} className="flex flex-col gap-1.5">
        {group.slots.length > 0 ? (
          <SortableContext
            items={group.slots.map((s) => `sort-${s.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {group.slots.map((slot) => {
              const assignment = assignmentsBySlotId.get(slot.id);
              const person = assignment
                ? personById.get(assignment.personId)
                : undefined;

              return (
                <OrbatSlot
                  key={slot.id}
                  slot={slot}
                  groupId={group.id}
                  assignment={assignment}
                  person={person}
                  onRemoveSlot={onRemoveSlot ? handleRemoveSlot : undefined}
                  onUpdateEquipment={
                    onUpdateSlot ? handleUpdateEquipment : undefined
                  }
                  onUnassign={onUnassign}
                  equipmentSuggestions={equipmentSuggestions}
                  showEquipment={showEquipment}
                  onTapAssign={onTapAssign}
                  isHighlighted={highlightSlotId === slot.id}
                />
              );
            })}
          </SortableContext>
        ) : (
          <p className="text-xs text-dim italic px-3 py-2">
            No slots in this group.
          </p>
        )}
      </div>

      {/* Add slot inline */}
      {onAddSlot && (
        <div className="px-1">
          {addingSlot ? (
            <input
              ref={inputRef}
              value={newRoleLabel}
              onChange={(e) => setNewRoleLabel(e.target.value)}
              onBlur={commitNewSlot}
              onKeyDown={handleInputKeyDown}
              placeholder="Role label…"
              aria-label="New slot role label"
              className="w-full bg-page border border-accent/50 rounded px-3 py-1.5 text-xs text-body placeholder-faint focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/25"
            />
          ) : (
            <button
              onClick={() => setAddingSlot(true)}
              type="button"
              className="flex items-center gap-1.5 text-xs text-accent/70 hover:text-accent transition-colors py-1"
            >
              <Plus size={12} />
              Add Slot
            </button>
          )}
        </div>
      )}
    </div>
  );
});
