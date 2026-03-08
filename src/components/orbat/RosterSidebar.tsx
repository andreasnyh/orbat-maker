import { useDraggable } from '@dnd-kit/core';
import clsx from 'clsx';
import { Search, X } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { usePeopleState } from '../../context/AppStateContext';
import type { Assignment, Person } from '../../types';
import { Badge } from '../common/Badge';
import { Toggle } from '../common/Toggle';

interface RosterSidebarProps {
  assignments: Assignment[];
  /** When provided, renders a close button at the top (used in mobile bottom-sheet mode) */
  onClose?: () => void;
  /** Additional class names applied to the root <aside> element */
  className?: string;
  /** When provided, renders tappable cards instead of draggable ones (used in mobile tap-to-assign flow) */
  onPersonTap?: (personId: string) => void;
  /** Initial value for the "show assigned" toggle */
  defaultShowAssigned?: boolean;
  /** Hide the search input (used in compact mobile mode) */
  hideSearch?: boolean;
}

// Thin wrapper that makes a single roster card draggable
const DraggablePersonCard = memo(function DraggablePersonCard({
  person,
  isAssigned,
}: {
  person: Person;
  isAssigned: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: person.id,
    data: { type: 'person', personId: person.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'roster-card relative cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
      {...attributes}
      {...listeners}
    >
      <DraggablePersonContent person={person} isAssigned={isAssigned} />
    </div>
  );
});

// Memoized inner content
const DraggablePersonContent = memo(function DraggablePersonContent({
  person,
  isAssigned,
}: {
  person: Person;
  isAssigned: boolean;
}) {
  return (
    <div
      className={clsx(
        'card px-3 py-2 select-none transition-all duration-150 pointer-events-none',
        'flex items-center gap-2',
        isAssigned && 'opacity-50',
      )}
    >
      {person.rank && <Badge variant="green">{person.rank}</Badge>}
      <span className="font-display text-body font-semibold truncate">
        {person.name}
      </span>
      {isAssigned && (
        <span className="ml-auto shrink-0">
          <Badge variant="default">Assigned</Badge>
        </span>
      )}
    </div>
  );
});

// Compact tappable row for mobile tap-to-assign flow
const TappablePersonRow = memo(function TappablePersonRow({
  person,
  isAssigned,
  onTap,
}: {
  person: Person;
  isAssigned: boolean;
  onTap: (personId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onTap(person.id)}
      className={clsx(
        'flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-md border transition-colors',
        isAssigned
          ? 'opacity-50 border-trim bg-page/50'
          : 'border-trim bg-panel-alt active:bg-panel-alt/80',
      )}
    >
      {person.rank && (
        <span className="text-accent text-xs font-data shrink-0">
          {person.rank}
        </span>
      )}
      <span className="font-display text-body font-medium truncate">
        {person.name}
      </span>
      {isAssigned && (
        <span className="ml-auto shrink-0">
          <Badge variant="default">Assigned</Badge>
        </span>
      )}
    </button>
  );
});

export function RosterSidebar({
  assignments,
  onClose,
  className,
  onPersonTap,
  defaultShowAssigned = false,
  hideSearch = false,
}: RosterSidebarProps) {
  const { people } = usePeopleState();
  const [search, setSearch] = useState('');
  const [showAssigned, setShowAssigned] = useState(defaultShowAssigned);

  const assignedPersonIds = useMemo(
    () => new Set(assignments.map((a) => a.personId)),
    [assignments],
  );

  const filtered = useMemo(
    () =>
      people
        .filter((p) => {
          if (!showAssigned && assignedPersonIds.has(p.id)) return false;
          if (!search.trim()) return true;
          const q = search.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            (p.rank?.toLowerCase().includes(q) ?? false)
          );
        })
        .sort((a, b) => {
          const aAssigned = assignedPersonIds.has(a.id) ? 1 : 0;
          const bAssigned = assignedPersonIds.has(b.id) ? 1 : 0;
          if (aAssigned !== bAssigned) return aAssigned - bAssigned;
          return a.name.localeCompare(b.name);
        }),
    [people, assignedPersonIds, showAssigned, search],
  );

  const assignedCount = assignedPersonIds.size;

  return (
    <aside className={clsx('flex flex-col gap-3 h-full', className)}>
      {/* Sidebar header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-dim uppercase">
            Roster
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-dim font-data">
              {assignedCount}/{people.length} assigned
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-dim hover:text-sub transition-colors p-1 -mr-1"
                aria-label="Close roster"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        {!hideSearch && (
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search personnel…"
              aria-label="Search personnel"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-page border border-trim rounded-md pl-8 pr-3 py-2 text-body text-sm
                         placeholder:text-faint focus-visible:outline-none focus-visible:border-accent/50 focus-visible:ring-1 focus-visible:ring-accent/25"
            />
          </div>
        )}

        {/* Hide assigned toggle */}
        <Toggle
          checked={showAssigned}
          onChange={setShowAssigned}
          label="Show assigned"
          size="md"
        />
      </div>

      {/* Divider */}
      <div className="border-t border-trim" />

      {/* Person list */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 pr-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-dim italic text-center py-8">
            {people.length === 0
              ? 'No personnel in roster. Add personnel first.'
              : 'No matches found.'}
          </p>
        ) : (
          filtered.map((person) =>
            onPersonTap ? (
              <TappablePersonRow
                key={person.id}
                person={person}
                isAssigned={assignedPersonIds.has(person.id)}
                onTap={onPersonTap}
              />
            ) : (
              <DraggablePersonCard
                key={person.id}
                person={person}
                isAssigned={assignedPersonIds.has(person.id)}
              />
            ),
          )
        )}
      </div>
    </aside>
  );
}
