import { useDraggable } from '@dnd-kit/core';
import clsx from 'clsx';
import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import type { Assignment, Person } from '../../types';
import { Badge } from '../common/Badge';
import { PersonCard } from '../people/PersonCard';

interface RosterSidebarProps {
  assignments: Assignment[];
  /** When provided, renders a close button at the top (used in mobile bottom-sheet mode) */
  onClose?: () => void;
  /** Additional class names applied to the root <aside> element */
  className?: string;
}

// Thin wrapper that makes a single PersonCard draggable
function DraggablePersonCard({
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
      className={clsx('relative', isDragging && 'opacity-40')}
    >
      <PersonCard
        person={person}
        className={clsx(
          'cursor-grab active:cursor-grabbing select-none',
          isAssigned && 'opacity-50',
        )}
        {...attributes}
        {...listeners}
      />
      {isAssigned && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <Badge variant="default">Assigned</Badge>
        </div>
      )}
    </div>
  );
}

export function RosterSidebar({
  assignments,
  onClose,
  className,
}: RosterSidebarProps) {
  const { people } = useAppState();
  const [search, setSearch] = useState('');
  const [hideAssigned, setHideAssigned] = useState(false);

  const assignedPersonIds = new Set(assignments.map((a) => a.personId));

  const filtered = people.filter((p) => {
    if (hideAssigned && assignedPersonIds.has(p.id)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.rank?.toLowerCase().includes(q) ?? false)
    );
  });

  const assignedCount = assignedPersonIds.size;

  return (
    <aside className={clsx('flex flex-col gap-3 h-full', className)}>
      {/* Sidebar header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-gray-400 uppercase tracking-widest">
            Roster
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600 font-data">
              {assignedCount}/{people.length} assigned
            </span>
            {/* Close button — only rendered in mobile bottom-sheet mode */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-300 transition-colors p-1 -mr-1"
                aria-label="Close roster"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search people…"
            aria-label="Search people"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0f0f23] border border-[#2a2a4a] rounded-md pl-8 pr-3 py-2 text-gray-200 text-sm
                       placeholder:text-gray-600 focus-visible:outline-none focus-visible:border-green-400/50 focus-visible:ring-1 focus-visible:ring-green-400/25"
          />
        </div>

        {/* Hide assigned toggle */}
        {/* biome-ignore lint/a11y/noLabelWithoutControl: custom toggle with keyboard handling */}
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          {/* biome-ignore lint/a11y/useSemanticElements: custom styled toggle switch */}
          <div
            role="checkbox"
            aria-checked={hideAssigned}
            tabIndex={0}
            onClick={() => setHideAssigned((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.preventDefault();
                setHideAssigned((v) => !v);
              } else if (e.key === 'Enter') {
                setHideAssigned((v) => !v);
              }
            }}
            className={clsx(
              'relative w-8 h-4.5 rounded-full transition-colors border shrink-0',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#1a1a2e]',
              hideAssigned
                ? 'bg-green-600 border-green-500'
                : 'bg-[#0f0f23] border-[#2a2a4a]',
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform',
                hideAssigned ? 'translate-x-4' : 'translate-x-0.5',
              )}
            />
          </div>
          <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
            Hide assigned
          </span>
        </label>
      </div>

      {/* Divider */}
      <div className="border-t border-[#2a2a4a]" />

      {/* Person list */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-600 italic text-center py-8">
            {people.length === 0
              ? 'No people in roster. Add people first.'
              : 'No matches found.'}
          </p>
        ) : (
          filtered.map((person) => (
            <DraggablePersonCard
              key={person.id}
              person={person}
              isAssigned={assignedPersonIds.has(person.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
