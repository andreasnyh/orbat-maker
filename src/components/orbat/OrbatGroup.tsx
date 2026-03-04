import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Assignment, Group, Person, Slot } from '../../types';
import { OrbatSlot } from './OrbatSlot';

interface OrbatGroupProps {
  group: Group;
  assignments: Assignment[];
  people: Person[];
  orbatId: string;
  onAddSlot?: (groupId: string, roleLabel: string) => void;
  onRemoveSlot?: (groupId: string, slotId: string) => void;
  onReorderSlots?: (groupId: string, slots: Slot[]) => void;
  onUpdateSlot?: (
    groupId: string,
    slotId: string,
    updates: Partial<Omit<Slot, 'id'>>,
  ) => void;
  equipmentSuggestions?: string[];
  showEquipment?: boolean;
  onTapAssign?: (slotId: string) => void;
  highlightSlotId?: string | null;
}

export function OrbatGroup({
  group,
  assignments,
  people,
  orbatId,
  onAddSlot,
  onRemoveSlot,
  onReorderSlots: _onReorderSlots,
  onUpdateSlot,
  equipmentSuggestions,
  showEquipment,
  onTapAssign,
  highlightSlotId,
}: OrbatGroupProps) {
  const [addingSlot, setAddingSlot] = useState(false);
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filledCount = group.slots.filter((slot) =>
    assignments.some((a) => a.slotId === slot.id),
  ).length;

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

  function handleRemoveSlot(slotId: string) {
    onRemoveSlot?.(group.id, slotId);
  }

  function handleUpdateEquipment(slotId: string, equipment: string[]) {
    onUpdateSlot?.(group.id, slotId, { equipment });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Group header */}
      <div className="flex items-center justify-between py-2 px-2 border-b border-[#2a2a4a] border-l-2 border-l-green-500/50 bg-linear-to-r from-green-500/5 to-transparent rounded-sm">
        <h3 className="font-display text-sm font-bold text-gray-300 uppercase tracking-widest">
          {group.name}
        </h3>
        <span className="text-xs text-gray-600 font-data">
          {filledCount}/{group.slots.length}
        </span>
      </div>

      {/* Slots — SortableContext uses the outer DndContext from OrbatBuilderPage */}
      <div className="flex flex-col gap-1.5">
        {group.slots.length > 0 ? (
          <SortableContext
            items={group.slots.map((s) => `sort-${s.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {group.slots.map((slot) => {
              const assignment = assignments.find((a) => a.slotId === slot.id);
              const person = assignment
                ? people.find((p) => p.id === assignment.personId)
                : undefined;

              return (
                <OrbatSlot
                  key={slot.id}
                  slot={slot}
                  assignment={assignment}
                  person={person}
                  orbatId={orbatId}
                  onRemoveSlot={onRemoveSlot ? handleRemoveSlot : undefined}
                  onUpdateEquipment={
                    onUpdateSlot ? handleUpdateEquipment : undefined
                  }
                  equipmentSuggestions={equipmentSuggestions}
                  showEquipment={showEquipment}
                  onTapAssign={onTapAssign}
                  isHighlighted={highlightSlotId === slot.id}
                />
              );
            })}
          </SortableContext>
        ) : (
          <p className="text-xs text-gray-600 italic px-3 py-2">
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
              className="w-full bg-[#0f0f23] border border-green-400/50 rounded px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-400/25"
            />
          ) : (
            <button
              onClick={() => setAddingSlot(true)}
              type="button"
              className="flex items-center gap-1.5 text-xs text-green-400/70 hover:text-green-400 transition-colors py-1"
            >
              <Plus size={12} />
              Add Slot
            </button>
          )}
        </div>
      )}
    </div>
  );
}
