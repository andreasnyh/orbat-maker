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
import { AlertTriangle, ArrowLeft, Clipboard, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import {
  copyToClipboard,
  formatOrbatForDiscord,
  formatOrbatForTeamspeak,
} from '../../lib/clipboard';
import type { Page, Person, Slot } from '../../types';
import { Button } from '../common/Button';
import { TextInput } from '../common/TextInput';
import { PersonCard } from '../people/PersonCard';
import { OrbatGroup } from './OrbatGroup';
import { RosterSidebar } from './RosterSidebar';

// Re-measure droppable rects frequently so collision detection stays
// accurate when the page or a nested container has been scrolled.
const measuringConfig = {
  droppable: { strategy: MeasuringStrategy.Always },
};

interface OrbatBuilderPageProps {
  orbatId: string;
  onNavigate: (page: Page) => void;
}

export function OrbatBuilderPage({
  orbatId,
  onNavigate,
}: OrbatBuilderPageProps) {
  const {
    orbats,
    templates,
    people,
    assignPersonToSlot,
    swapSlotAssignments,
    movePersonToSlot,
    updateOrbat,
    ensureOwnTemplate,
    addSlotToGroup,
    removeSlotFromGroup,
    reorderSlotsInGroup,
    unassignSlot,
  } = useAppState();

  const orbat = orbats.find((o) => o.id === orbatId);
  const template = orbat
    ? templates.find((t) => t.id === orbat.templateId)
    : undefined;

  // ---- Local state ----------------------------------------------------------
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const overlayRef = useRef<HTMLDivElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(orbat?.name ?? '');
  const [discordCopied, setDiscordCopied] = useState(false);
  const [teamspeakCopied, setTeamspeakCopied] = useState(false);
  const [showRoster, setShowRoster] = useState(false);

  // ---- DnD sensors ---------------------------------------------------------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
  );

  // ---- Pointer tracking for custom overlay ---------------------------------
  useEffect(() => {
    if (!activePerson) {
      setPointerPos(null);
      return;
    }
    function onPointerMove(e: PointerEvent) {
      setPointerPos({ x: e.clientX, y: e.clientY });
    }
    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [activePerson]);

  // ---- Drag handlers -------------------------------------------------------

  function handleDragStart(event: DragStartEvent) {
    const personId = event.active.data.current?.personId;
    const person = people.find((p) => p.id === personId);
    setActivePerson(person ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActivePerson(null);
    setPointerPos(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // ---- Slot reorder drag (grip handle) ----
    if (active.data.current?.type === 'slot-reorder') {
      const activeSlotId = active.data.current.slotId as string;
      const overSlotId = over.data.current?.slotId as string | undefined;
      if (!overSlotId || !template) return;

      // Find the group containing this slot
      const group = template.groups.find((g) =>
        g.slots.some((s) => s.id === activeSlotId),
      );
      if (!group) return;

      const oldIndex = group.slots.findIndex((s) => s.id === activeSlotId);
      const newIndex = group.slots.findIndex((s) => s.id === overSlotId);
      if (oldIndex === -1 || newIndex === -1) return;

      handleReorderSlots(group.id, arrayMove(group.slots, oldIndex, newIndex));
      return;
    }

    // ---- Person drag (roster or slot-to-slot) ----
    const personId = active.data.current?.personId as string | undefined;
    const sourceSlotId = active.data.current?.sourceSlotId as
      | string
      | undefined;
    const targetSlotId = over.data.current?.slotId as string | undefined;

    if (!targetSlotId || !personId) return;

    // Dragged from a slot (re-arranging within the ORBAT)
    if (sourceSlotId) {
      if (sourceSlotId === targetSlotId) return; // dropped on same slot
      // Check if target slot has someone assigned
      const targetAssignment = orbat?.assignments.find(
        (a) => a.slotId === targetSlotId,
      );
      if (targetAssignment) {
        swapSlotAssignments(orbatId, sourceSlotId, targetSlotId);
      } else {
        movePersonToSlot(orbatId, sourceSlotId, targetSlotId);
      }
    } else {
      // Dragged from roster sidebar
      assignPersonToSlot(orbatId, targetSlotId, personId);
    }
  }

  // ---- Name editing --------------------------------------------------------

  function handleNameCommit() {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== orbat?.name) {
      updateOrbat(orbatId, { name: trimmed });
    } else if (!trimmed) {
      // Revert to existing name if field is cleared
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

  async function handleCopyDiscord() {
    if (!orbat || !template) return;
    const text = formatOrbatForDiscord(orbat, template, people);
    const ok = await copyToClipboard(text);
    if (ok) {
      setDiscordCopied(true);
      setTimeout(() => setDiscordCopied(false), 2000);
    }
  }

  async function handleCopyTeamspeak() {
    if (!orbat || !template) return;
    const text = formatOrbatForTeamspeak(orbat, template, people);
    const ok = await copyToClipboard(text);
    if (ok) {
      setTeamspeakCopied(true);
      setTimeout(() => setTeamspeakCopied(false), 2000);
    }
  }

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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      measuring={measuringConfig}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4 h-full">
        {/* Top bar */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('orbats')}
            className="flex-shrink-0"
          >
            <ArrowLeft size={14} />
            ORBATs
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
              <h1
                className="text-xl font-bold text-gray-100 truncate cursor-pointer hover:text-green-400 transition-colors"
                onClick={() => {
                  setNameValue(orbat.name);
                  setEditingName(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setNameValue(orbat.name);
                    setEditingName(true);
                  }
                }}
                title="Click to rename"
              >
                {orbat.name}
              </h1>
            )}
          </div>

          {/* Template & date meta */}
          <div className="flex-shrink-0 text-right text-xs text-gray-600 hidden sm:block">
            {template && <div>{template.name}</div>}
            {orbat.date && <div>{orbat.date}</div>}
          </div>

          {/* Copy buttons — only shown when a template is available */}
          {template && (
            <div className="flex-shrink-0 flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyDiscord}
                title="Copy formatted ORBAT for Discord"
                className={discordCopied ? 'text-green-400' : ''}
              >
                <Clipboard size={14} />
                {discordCopied ? 'Copied!' : 'Discord'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyTeamspeak}
                title="Copy formatted ORBAT for TeamSpeak"
                className={teamspeakCopied ? 'text-green-400' : ''}
              >
                <Clipboard size={14} />
                {teamspeakCopied ? 'Copied!' : 'TeamSpeak'}
              </Button>
            </div>
          )}
        </div>

        {/* Missing template warning */}
        {!template && (
          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3 text-yellow-300 text-sm flex items-center gap-2">
            <AlertTriangle size={16} className="flex-shrink-0" />
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
              className="w-80 flex-shrink-0"
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
                    assignments={orbat.assignments}
                    people={people}
                    orbatId={orbatId}
                    onAddSlot={handleAddSlot}
                    onRemoveSlot={handleRemoveSlot}
                    onReorderSlots={handleReorderSlots}
                  />
                ))}
                {template.groups.length === 0 && (
                  <div className="text-center py-16 text-gray-600 text-sm italic">
                    This template has no groups. Edit the template to add groups
                    and slots.
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
      {activePerson && pointerPos && (
        <div
          ref={overlayRef}
          className="pointer-events-none"
          style={{
            position: 'fixed',
            top: pointerPos.y,
            left: pointerPos.x,
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
          }}
        >
          <PersonCard
            person={activePerson}
            className="rotate-2 shadow-2xl shadow-black/50 cursor-grabbing opacity-95"
          />
        </div>
      )}

      {/* ---- Mobile roster bottom-sheet ---- */}

      {/* FAB: Show Roster button — mobile only */}
      <button
        type="button"
        onClick={() => setShowRoster(true)}
        className="fixed bottom-20 right-4 z-40 md:hidden flex items-center gap-2 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white rounded-full px-4 py-3 shadow-lg shadow-black/40 transition-colors min-h-[44px]"
        aria-label="Show roster"
      >
        <Users size={18} />
        <span className="text-sm font-medium">Roster</span>
      </button>

      {/* Semi-transparent backdrop */}
      {showRoster && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setShowRoster(false)}
          aria-hidden="true"
        />
      )}

      {/* Bottom sheet panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#1a1a2e] border-t border-[#2a2a4a] rounded-t-xl shadow-2xl transition-transform duration-300 ${
          showRoster ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '70dvh',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-hidden={!showRoster}
      >
        <div className="flex flex-col p-4" style={{ maxHeight: '70dvh' }}>
          {/* Drag handle indicator */}
          <div className="flex justify-center mb-3 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-[#2a2a4a]" />
          </div>

          <RosterSidebar
            assignments={orbat.assignments}
            onClose={() => setShowRoster(false)}
            className="flex-1 min-h-0 overflow-hidden"
          />
        </div>
      </div>
    </DndContext>
  );
}
