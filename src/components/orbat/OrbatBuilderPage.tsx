import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clipboard,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useCrossCuttingState,
  useOrbatsState,
  usePeopleState,
  useTemplatesState,
} from '../../context/AppStateContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useToast } from '../../hooks/useToast';
import {
  copyToClipboard,
  formatOrbatForDiscord,
  formatOrbatForTeamspeak,
} from '../../lib/clipboard';
import type { Page, Person, Slot } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { TextInput } from '../common/TextInput';
import { Toggle } from '../common/Toggle';
import { OrbatGroup } from './OrbatGroup';
import { RosterSidebar } from './RosterSidebar';

// Re-measure droppable rects frequently so collision detection stays
// accurate when the page or a nested container has been scrolled.
const measuringConfig = {
  droppable: { strategy: MeasuringStrategy.WhileDragging },
};

interface OrbatBuilderPageProps {
  orbatId: string;
  onNavigate: (page: Page) => void;
}

export function OrbatBuilderPage({
  orbatId,
  onNavigate,
}: OrbatBuilderPageProps) {
  const { people } = usePeopleState();
  const {
    templates,
    addSlotToGroup,
    removeSlotFromGroup,
    reorderSlotsInGroup,
    moveSlotBetweenGroups,
    updateSlot,
  } = useTemplatesState();
  const {
    orbats,
    assignPersonToSlot,
    swapSlotAssignments,
    movePersonToSlot,
    clearAssignments,
    updateOrbat,
    unassignSlot,
  } = useOrbatsState();
  const { ensureOwnTemplate } = useCrossCuttingState();
  const toast = useToast();

  const orbat = orbats.find((o) => o.id === orbatId);
  const template = orbat
    ? templates.find((t) => t.id === orbat.templateId)
    : undefined;

  const isMobile = useIsMobile();

  // ---- Local state ----------------------------------------------------------
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(orbat?.name ?? '');
  const [showRoster, setShowRoster] = useState(false);
  const [showEquipment, setShowEquipment] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [tapTargetSlotId, setTapTargetSlotId] = useState<string | null>(null);
  const [copiedTarget, setCopiedTarget] = useState<
    'discord' | 'teamspeak' | null
  >(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ---- DnD sensors ---------------------------------------------------------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
  );

  // ---- Pointer tracking for custom overlay ---------------------------------
  useEffect(() => {
    if (!activePerson) {
      if (overlayRef.current) {
        overlayRef.current.style.display = 'none';
      }
      return;
    }
    if (overlayRef.current) {
      overlayRef.current.style.display = '';
    }
    function onPointerMove(e: PointerEvent) {
      if (overlayRef.current) {
        overlayRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      }
    }
    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [activePerson]);

  // ---- Derived data (memoized) ----------------------------------------------

  const templateGroups = template?.groups;
  const assignments = orbat?.assignments;
  const assignmentsBySlotId = useMemo(
    () => new Map(assignments ? assignments.map((a) => [a.slotId, a]) : []),
    [assignments],
  );

  const personById = useMemo(
    () => new Map(people.map((p) => [p.id, p])),
    [people],
  );

  const equipmentSuggestions = useMemo(
    () =>
      templateGroups
        ? Array.from(
            new Set(
              templateGroups.flatMap((g) =>
                g.slots.flatMap((s) => s.equipment ?? []),
              ),
            ),
          )
        : [],
    [templateGroups],
  );

  // ---- Slot management (auto-fork + mutate) --------------------------------

  const handleAddSlot = useCallback(
    (groupId: string, roleLabel: string) => {
      const tid = ensureOwnTemplate(orbatId);
      if (tid) addSlotToGroup(tid, groupId, roleLabel);
    },
    [orbatId, ensureOwnTemplate, addSlotToGroup],
  );

  const handleRemoveSlot = useCallback(
    (groupId: string, slotId: string) => {
      const tid = ensureOwnTemplate(orbatId);
      if (tid) {
        unassignSlot(orbatId, slotId);
        removeSlotFromGroup(tid, groupId, slotId);
      }
    },
    [orbatId, ensureOwnTemplate, removeSlotFromGroup, unassignSlot],
  );

  const handleReorderSlots = useCallback(
    (groupId: string, slots: Slot[]) => {
      const tid = ensureOwnTemplate(orbatId);
      if (tid) reorderSlotsInGroup(tid, groupId, slots);
    },
    [orbatId, ensureOwnTemplate, reorderSlotsInGroup],
  );

  const handleMoveSlotBetweenGroups = useCallback(
    (
      fromGroupId: string,
      toGroupId: string,
      slotId: string,
      targetIndex: number,
    ) => {
      const tid = ensureOwnTemplate(orbatId);
      if (tid)
        moveSlotBetweenGroups(tid, fromGroupId, toGroupId, slotId, targetIndex);
    },
    [orbatId, ensureOwnTemplate, moveSlotBetweenGroups],
  );

  const handleUpdateSlot = useCallback(
    (groupId: string, slotId: string, updates: Partial<Omit<Slot, 'id'>>) => {
      const tid = ensureOwnTemplate(orbatId);
      if (tid) updateSlot(tid, groupId, slotId, updates);
    },
    [orbatId, ensureOwnTemplate, updateSlot],
  );

  const handleUnassign = useCallback(
    (slotId: string) => {
      unassignSlot(orbatId, slotId);
    },
    [orbatId, unassignSlot],
  );

  // ---- Drag handlers -------------------------------------------------------

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const personId = event.active.data.current?.personId;
      const person = personById.get(personId);
      setActivePerson(person ?? null);
    },
    [personById],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActivePerson(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      // ---- Slot reorder drag (grip handle) ----
      if (active.data.current?.type === 'slot-reorder') {
        if (!template) return;
        const activeSlotId = active.data.current.slotId as string;
        const activeGroupId = active.data.current.groupId as string;
        const overGroupId = over.data.current?.groupId as string | undefined;
        const overSlotId = over.data.current?.slotId as string | undefined;

        if (!overGroupId) return;

        if (activeGroupId === overGroupId) {
          // Same group — reorder
          if (!overSlotId) return;
          const group = template.groups.find((g) => g.id === activeGroupId);
          if (!group) return;
          const oldIndex = group.slots.findIndex((s) => s.id === activeSlotId);
          const newIndex = group.slots.findIndex((s) => s.id === overSlotId);
          if (oldIndex === -1 || newIndex === -1) return;
          handleReorderSlots(
            group.id,
            arrayMove(group.slots, oldIndex, newIndex),
          );
        } else {
          // Different group — move between groups
          const toGroup = template.groups.find((g) => g.id === overGroupId);
          if (!toGroup) return;
          const targetIndex = overSlotId
            ? toGroup.slots.findIndex((s) => s.id === overSlotId)
            : toGroup.slots.length;
          handleMoveSlotBetweenGroups(
            activeGroupId,
            overGroupId,
            activeSlotId,
            targetIndex === -1 ? toGroup.slots.length : targetIndex,
          );
        }
        return;
      }

      // ---- Person drag (roster or slot-to-slot) ----
      const personId = active.data.current?.personId as string | undefined;
      const sourceSlotId = active.data.current?.sourceSlotId as
        | string
        | undefined;
      const targetSlotId = over.data.current?.slotId as string | undefined;

      if (!targetSlotId || !personId) return;

      if (sourceSlotId) {
        if (sourceSlotId === targetSlotId) return;
        const targetAssignment = assignmentsBySlotId.get(targetSlotId);
        if (targetAssignment) {
          swapSlotAssignments(orbatId, sourceSlotId, targetSlotId);
        } else {
          movePersonToSlot(orbatId, sourceSlotId, targetSlotId);
        }
      } else {
        assignPersonToSlot(orbatId, targetSlotId, personId);
      }
    },
    [
      template,
      handleReorderSlots,
      handleMoveSlotBetweenGroups,
      assignmentsBySlotId,
      orbatId,
      swapSlotAssignments,
      movePersonToSlot,
      assignPersonToSlot,
    ],
  );

  // ---- Name editing --------------------------------------------------------

  function handleNameCommit() {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== orbat?.name) {
      updateOrbat(orbatId, { name: trimmed });
    } else if (!trimmed) {
      setNameValue(orbat?.name ?? '');
    }
    setEditingName(false);
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleNameCommit();
    if (e.key === 'Escape') {
      setNameValue(orbat?.name ?? '');
      setEditingName(false);
    }
  }

  // ---- Clipboard copy handlers --------------------------------------------

  async function handleCopy(target: 'discord' | 'teamspeak') {
    if (!orbat || !template || copiedTarget) return;
    const text =
      target === 'discord'
        ? formatOrbatForDiscord(orbat, template, people, showEquipment)
        : formatOrbatForTeamspeak(orbat, template, people, showEquipment);
    const label = target === 'discord' ? 'Discord' : 'TeamSpeak';
    const ok = await copyToClipboard(text);
    if (ok) {
      toast.success(`Copied for ${label}`);
      clearTimeout(copiedTimerRef.current);
      setCopiedTarget(target);
      copiedTimerRef.current = setTimeout(() => setCopiedTarget(null), 1500);
    } else {
      toast.error(`Failed to copy — clipboard not available`);
    }
  }

  // ---- Tap-to-assign (mobile) -----------------------------------------------

  const handleTapAssign = useCallback((slotId: string) => {
    setTapTargetSlotId(slotId);
    setShowRoster(true);
  }, []);

  const handlePersonTap = useCallback(
    (personId: string) => {
      if (!tapTargetSlotId) return;
      assignPersonToSlot(orbatId, tapTargetSlotId, personId);
      setTapTargetSlotId(null);
      setShowRoster(false);
    },
    [tapTargetSlotId, orbatId, assignPersonToSlot],
  );

  const tapTargetSlot = useMemo(() => {
    if (!tapTargetSlotId || !template) return undefined;
    for (const g of template.groups) {
      const s = g.slots.find((s) => s.id === tapTargetSlotId);
      if (s) return s;
    }
    return undefined;
  }, [tapTargetSlotId, template]);

  // ---- Guard: ORBAT not found ---------------------------------------------

  if (!orbat) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <AlertTriangle size={40} className="text-yellow-400" />
        <p className="text-gray-400">ORBAT not found.</p>
        <Button variant="secondary" onClick={() => onNavigate('orbats')}>
          <ArrowLeft size={14} />
          Back to ORBATs
        </Button>
      </div>
    );
  }

  // ---- Render -------------------------------------------------------------

  const copyButtons = (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => handleCopy('discord')}
        disabled={copiedTarget != null}
        title="Copy formatted ORBAT for Discord"
      >
        {copiedTarget === 'discord' ? (
          <Check size={14} className="text-green-400" />
        ) : (
          <Clipboard size={14} />
        )}
        Discord
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => handleCopy('teamspeak')}
        disabled={copiedTarget != null}
        title="Copy formatted ORBAT for TeamSpeak"
      >
        {copiedTarget === 'teamspeak' ? (
          <Check size={14} className="text-green-400" />
        ) : (
          <Clipboard size={14} />
        )}
        TeamSpeak
      </Button>
    </>
  );

  const clearButton = orbat.assignments.length > 0 && (
    <Button
      variant="danger"
      size="sm"
      onClick={() => setConfirmClear(true)}
      title="Clear all assignments"
    >
      <RotateCcw size={14} />
      Clear
    </Button>
  );

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        measuring={measuringConfig}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-4 h-full">
          {/* Top bar */}
          <div className="flex flex-col gap-3">
            {/* Row 1: Back button + ORBAT name */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('orbats')}
                className="shrink-0"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">ORBATs</span>
              </Button>

              {/* Editable ORBAT name */}
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <TextInput
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onBlur={handleNameCommit}
                    onKeyDown={handleNameKeyDown}
                    autoFocus
                    className="text-xl font-bold"
                  />
                ) : (
                  <button
                    type="button"
                    className="font-display text-xl font-bold text-gray-100 uppercase tracking-wide truncate cursor-pointer hover:text-green-400 transition-colors inline-flex items-center gap-2 group/name"
                    onClick={() => {
                      setNameValue(orbat.name);
                      setEditingName(true);
                    }}
                    title="Click to rename"
                  >
                    <span className="truncate">{orbat.name}</span>
                    <Pencil
                      size={14}
                      className="shrink-0 text-gray-600 group-hover/name:text-green-400 transition-colors"
                    />
                  </button>
                )}
              </div>

              {/* Toggle, copy & clear — inline on desktop */}
              {template && (
                <div className="shrink-0 hidden md:flex items-stretch gap-4 divide-x divide-[#2a2a4a]">
                  <div className="flex items-center gap-4 pr-4">
                    <Toggle
                      checked={showEquipment}
                      onChange={setShowEquipment}
                      label="Show equipment"
                      size="md"
                    />
                    {clearButton}
                  </div>
                  <div className="flex items-center gap-2">{copyButtons}</div>
                </div>
              )}
            </div>

            {/* Row 2: Action buttons on mobile */}
            {template && (
              <div className="flex md:hidden flex-col-reverse gap-4">
                <div className="flex items-center justify-between">
                  <Toggle
                    checked={showEquipment}
                    onChange={setShowEquipment}
                    label="Show equipment"
                    size="md"
                  />
                  {clearButton}
                </div>
                <div className="flex items-center gap-2 *:flex-1">
                  {copyButtons}
                </div>
              </div>
            )}
          </div>

          {/* Template meta */}
          {template && (
            <div className="text-xs text-gray-500 hidden sm:flex items-center gap-2">
              <span>{template.name}</span>
            </div>
          )}

          {/* Missing template warning */}
          {!template && (
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3 text-yellow-300 text-sm flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              The template for this ORBAT no longer exists. You can still view
              assignments but cannot add new slots.
            </div>
          )}

          {/* Main split layout */}
          <div className="flex gap-6 min-h-0 flex-1">
            {/* Left: Roster sidebar — desktop only */}
            <div className="hidden md:block">
              <RosterSidebar
                assignments={orbat.assignments}
                className="w-80 shrink-0"
              />
            </div>

            {/* Right: ORBAT slot grid */}
            <div className="flex-1 overflow-y-auto">
              {template ? (
                <div className="flex flex-col gap-6">
                  {template.groups.map((group) => (
                    <OrbatGroup
                      key={group.id}
                      group={group}
                      assignmentsBySlotId={assignmentsBySlotId}
                      personById={personById}
                      onAddSlot={handleAddSlot}
                      onRemoveSlot={handleRemoveSlot}
                      onReorderSlots={handleReorderSlots}
                      onUpdateSlot={handleUpdateSlot}
                      onUnassign={handleUnassign}
                      equipmentSuggestions={equipmentSuggestions}
                      showEquipment={showEquipment}
                      onTapAssign={isMobile ? handleTapAssign : undefined}
                      highlightSlotId={tapTargetSlotId}
                    />
                  ))}
                  {template.groups.length === 0 && (
                    <div className="text-center py-16 text-gray-600 text-sm italic">
                      This template has no groups. Edit the template to add
                      groups and slots.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-600 text-sm italic">
                  Template unavailable — cannot display slots.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating drag overlay — positioned directly at pointer to avoid
          scroll-offset issues with DragOverlay's built-in positioning */}
        <DragOverlay dropAnimation={null} />
        <div
          ref={overlayRef}
          className="pointer-events-none"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999,
            display: 'none',
          }}
        >
          {activePerson && (
            <div className="card px-3 py-2 flex items-center gap-2 rotate-2 shadow-2xl shadow-black/50 cursor-grabbing opacity-95">
              {activePerson.rank && (
                <Badge variant="green">{activePerson.rank}</Badge>
              )}
              <span className="font-display text-gray-200 font-semibold truncate">
                {activePerson.name}
              </span>
            </div>
          )}
        </div>

        <ConfirmDialog
          open={confirmClear}
          title="Clear all assignments?"
          message="This will unassign every person from this ORBAT. The ORBAT structure and roster are kept."
          confirmLabel="Clear"
          onConfirm={() => clearAssignments(orbatId)}
          onClose={() => setConfirmClear(false)}
        />
      </DndContext>

      {/* ---- Mobile roster bottom-sheet (outside DndContext so touch scroll works) ---- */}

      {/* Semi-transparent backdrop */}
      {showRoster && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => {
            setShowRoster(false);
            setTapTargetSlotId(null);
          }}
          aria-hidden="true"
        />
      )}

      {/* Bottom sheet panel — sits above the 4rem MobileNav */}
      <div
        className={`fixed left-0 right-0 z-50 md:hidden bg-[#1a1a2e] border-t border-[#2a2a4a] rounded-t-xl shadow-2xl transition-transform duration-300 flex flex-col overflow-hidden p-4 ${
          showRoster ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          bottom: '4rem',
          maxHeight: 'calc(70dvh - 4rem)',
          overscrollBehavior: 'contain',
        }}
        aria-hidden={!showRoster}
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center mb-3 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#2a2a4a]" />
        </div>

        {/* Tap-assign banner */}
        {tapTargetSlot && (
          <div className="bg-green-400/10 border border-green-400/30 rounded-lg px-3 py-2 mb-3 shrink-0">
            <span className="text-sm text-green-300">
              Assigning to: <strong>{tapTargetSlot.roleLabel}</strong>
            </span>
          </div>
        )}

        <RosterSidebar
          assignments={orbat.assignments}
          onPersonTap={tapTargetSlotId ? handlePersonTap : undefined}
          hideSearch
          className="flex-1 min-h-0 overflow-hidden"
        />
      </div>
    </>
  );
}
