import { useDraggable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import type { Assignment, Person, Slot } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EquipmentPills } from '../common/EquipmentPills';

interface OrbatSlotProps {
  slot: Slot;
  groupId: string;
  assignment: Assignment | undefined;
  person: Person | undefined;
  onRemoveSlot?: (slotId: string) => void;
  onUpdateEquipment?: (slotId: string, equipment: string[]) => void;
  equipmentSuggestions?: string[];
  showEquipment?: boolean;
  onTapAssign?: (slotId: string) => void;
  isHighlighted?: boolean;
  onUnassign?: (slotId: string) => void;
}

// ---------------------------------------------------------------------------
// Thin wrapper: runs dnd hooks (which subscribe to DndContext and force
// re-renders on every pointer-move during drag), then delegates all heavy
// rendering to the memoized OrbatSlotContent below.
// ---------------------------------------------------------------------------
export const OrbatSlot = memo(function OrbatSlot(props: OrbatSlotProps) {
  const { slot, groupId, assignment } = props;

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
    data: { type: 'slot-reorder', slotId: slot.id, groupId },
  });

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

  const sortableStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setSortableRef} style={sortableStyle}>
      <OrbatSlotContent
        slot={props.slot}
        groupId={props.groupId}
        assignment={props.assignment}
        person={props.person}
        onRemoveSlot={props.onRemoveSlot}
        onUpdateEquipment={props.onUpdateEquipment}
        equipmentSuggestions={props.equipmentSuggestions}
        showEquipment={props.showEquipment}
        onTapAssign={props.onTapAssign}
        isHighlighted={props.isHighlighted}
        onUnassign={props.onUnassign}
        isDragging={isDragging}
        isOver={isOver}
        sortableAttrs={sortableAttrs}
        sortableListeners={sortableListeners}
        setDragRef={setDragRef}
        dragAttrs={dragAttrs}
        dragListeners={dragListeners}
      />
    </div>
  );
});

// ---------------------------------------------------------------------------
// Memoized content — contains all the expensive JSX, local state, effects.
//
// Custom comparator intentionally skips dnd listener/attribute objects: they
// get new identities every render but are functionally stable for non-active
// slots. During an active drag only one item can be dragged at a time, so
// stale listeners on other slots are never invoked. When the drag ends
// everything re-renders and listeners refresh.
// ---------------------------------------------------------------------------

interface OrbatSlotContentProps extends OrbatSlotProps {
  isDragging: boolean;
  isOver: boolean;
  sortableAttrs: React.HTMLAttributes<HTMLElement>;
  sortableListeners: ReturnType<typeof useSortable>['listeners'];
  setDragRef: (node: HTMLElement | null) => void;
  dragAttrs: React.HTMLAttributes<HTMLElement>;
  dragListeners: ReturnType<typeof useDraggable>['listeners'];
}

const OrbatSlotContent = memo(
  function OrbatSlotContent({
    slot,
    assignment,
    person,
    onRemoveSlot,
    onUpdateEquipment,
    equipmentSuggestions,
    showEquipment,
    onTapAssign,
    isHighlighted,
    onUnassign,
    isDragging,
    isOver,
    sortableAttrs,
    sortableListeners,
    setDragRef,
    dragAttrs,
    dragListeners,
  }: OrbatSlotContentProps) {
    const [confirmRemove, setConfirmRemove] = useState(false);
    const [equipPopoverOpen, setEquipPopoverOpen] = useState(false);
    const [newTag, setNewTag] = useState('');
    const popoverRef = useRef<HTMLDivElement>(null);
    const tagInputRef = useRef<HTMLInputElement>(null);

    function handleUnassign(e: React.MouseEvent) {
      e.stopPropagation();
      onUnassign?.(slot.id);
    }

    function handleRemoveSlot(e: React.MouseEvent) {
      e.stopPropagation();
      setConfirmRemove(true);
    }

    function closeEquipPopover() {
      setEquipPopoverOpen(false);
      setNewTag('');
    }

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

    // ---- Shared sub-elements ----

    const equipmentSection = showEquipment && (
      <div className="flex items-center gap-1 shrink-0 relative">
        <EquipmentPills
          equipment={slot.equipment ?? []}
          onRemove={onUpdateEquipment ? handleRemoveEquipment : undefined}
        />
        {onUpdateEquipment && (
          <>
            <button
              type="button"
              className="text-amber-400/70 hover:text-amber-300 transition-colors p-2 md:p-1 rounded"
              aria-label="Add equipment"
              title="Add equipment"
              onClick={(e) => {
                e.stopPropagation();
                setEquipPopoverOpen((v) => !v);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Plus size={12} className="md:size-4 size-5" />
            </button>
            {equipPopoverOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={closeEquipPopover}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-hidden="true"
                />
                <div
                  ref={popoverRef}
                  className="absolute right-0 top-full mt-1 z-50 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg shadow-xl p-2 min-w-[200px]"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {equipmentSuggestions && equipmentSuggestions.length > 0 && (
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
                  <input
                    ref={tagInputRef}
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddEquipment(newTag);
                        setNewTag('');
                      }
                      if (e.key === 'Escape') closeEquipPopover();
                    }}
                    placeholder="New tag…"
                    aria-label="New equipment tag"
                    className="w-full bg-[#0f0f23] border border-[#2a2a4a] rounded px-2 py-1 text-[11px] text-gray-200 placeholder-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/25 font-mono"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    );

    const unassignButton = assignment && (
      <button
        type="button"
        onClick={handleUnassign}
        onPointerDown={(e) => e.stopPropagation()}
        className="shrink-0 text-gray-500 hover:text-red-400 transition-colors p-2 md:p-1 rounded"
        aria-label={`Remove ${person?.name ?? 'person'} from ${slot.roleLabel}`}
        title="Remove assignment"
      >
        <X size={14} className="md:size-4 size-5" />
      </button>
    );

    const removeSlotButton = onRemoveSlot && (
      <button
        type="button"
        onClick={handleRemoveSlot}
        onPointerDown={(e) => e.stopPropagation()}
        className="shrink-0 text-gray-500 hover:text-red-400 transition-colors p-2 md:p-1 rounded"
        aria-label={`Delete ${slot.roleLabel} slot`}
        title="Delete slot"
      >
        <Trash2 size={13} className="md:size-4 size-5" />
      </button>
    );

    const outerClasses = clsx(
      'group/slot rounded-md border transition-all duration-150',
      isDragging
        ? 'opacity-40'
        : isHighlighted
          ? 'border-green-400 ring-2 ring-green-400 bg-green-400/5'
          : isOver
            ? 'border-green-400 border-dashed bg-green-400/5'
            : assignment
              ? 'border-[#2a2a4a] bg-[#16213e] hover:border-[#3a3a5a] hover:bg-[#1a2744]'
              : 'border-[#2a2a4a] border-dashed bg-[#0f0f23]/50 hover:border-[#3a3a5a] hover:bg-[#0f0f23]/80',
    );

    return (
      <>
        {/* ---- Desktop layout ---- */}
        {!onTapAssign && (
          <div
            className={clsx(
              outerClasses,
              'flex items-center gap-2 px-2 py-2.5',
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
                className="text-gray-700 group-hover/slot:text-gray-400 shrink-0 transition-colors"
              />
              <span
                className="font-data text-sm text-gray-400 w-44 shrink-0 truncate"
                title={slot.roleLabel}
              >
                {slot.roleLabel}
              </span>
            </div>

            <span className="text-gray-700 shrink-0">—</span>

            {/* Person drag zone */}
            <span
              ref={setDragRef}
              className={clsx(
                'flex-1 min-w-0 flex items-center gap-1.5 rounded-sm px-1.5 -mx-0.5 -my-0.5 py-0.5 transition-colors',
                person
                  ? 'font-display text-lg text-gray-200 font-medium cursor-grab active:cursor-grabbing hover:bg-white/5'
                  : 'text-sm text-gray-400 italic font-data',
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

            {equipmentSection}
            {unassignButton}
            {removeSlotButton}
          </div>
        )}

        {/* ---- Mobile layout ---- */}
        {onTapAssign && (
          <div
            className={clsx(outerClasses, 'flex flex-col gap-1 px-2.5 py-2')}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="font-data text-sm text-gray-400 truncate shrink min-w-0"
                title={slot.roleLabel}
              >
                {slot.roleLabel}
              </span>
              <div className="ml-auto flex items-center gap-1 shrink-0">
                {equipmentSection}
                {unassignButton}
                {removeSlotButton}
              </div>
            </div>

            <button
              type="button"
              className={clsx(
                'rounded px-2 py-1.5 -mx-0.5 transition-colors w-full text-left active:bg-white/5',
                person
                  ? 'font-display text-base text-gray-200 font-medium'
                  : 'border border-dashed border-[#2a2a4a] text-sm text-gray-400 italic font-data',
              )}
              onClick={() => onTapAssign(slot.id)}
            >
              {person ? (
                <span className="flex items-center gap-1.5">
                  {person.rank && (
                    <span className="text-green-400 text-sm font-normal font-data">
                      {person.rank}
                    </span>
                  )}
                  <span className="truncate">{person.name}</span>
                </span>
              ) : (
                <span>Tap to assign</span>
              )}
            </button>
          </div>
        )}

        {confirmRemove && (
          <ConfirmDialog
            open={confirmRemove}
            title={`Delete "${slot.roleLabel}" slot?`}
            message="This will permanently remove the slot from this group."
            confirmLabel="Delete"
            onConfirm={() => onRemoveSlot?.(slot.id)}
            onClose={() => setConfirmRemove(false)}
          />
        )}
      </>
    );
  },
  (prev, next) =>
    prev.slot === next.slot &&
    prev.groupId === next.groupId &&
    prev.assignment === next.assignment &&
    prev.person === next.person &&
    prev.isDragging === next.isDragging &&
    prev.isOver === next.isOver &&
    prev.isHighlighted === next.isHighlighted &&
    prev.showEquipment === next.showEquipment &&
    prev.onRemoveSlot === next.onRemoveSlot &&
    prev.onUpdateEquipment === next.onUpdateEquipment &&
    prev.onTapAssign === next.onTapAssign &&
    prev.onUnassign === next.onUnassign &&
    prev.equipmentSuggestions === next.equipmentSuggestions,
);
