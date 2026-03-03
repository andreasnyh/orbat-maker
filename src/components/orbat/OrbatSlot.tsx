import { useDroppable } from '@dnd-kit/core'
import { X } from 'lucide-react'
import clsx from 'clsx'
import { useAppState } from '../../context/AppStateContext'
import type { Slot, Assignment, Person } from '../../types'

interface OrbatSlotProps {
  slot: Slot
  assignment: Assignment | undefined
  person: Person | undefined
  orbatId: string
}

export function OrbatSlot({ slot, assignment, person, orbatId }: OrbatSlotProps) {
  const { unassignSlot } = useAppState()

  const { setNodeRef, isOver } = useDroppable({
    id: slot.id,
    data: { type: 'slot', slotId: slot.id },
  })

  function handleUnassign(e: React.MouseEvent) {
    e.stopPropagation()
    unassignSlot(orbatId, slot.id)
  }

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'flex items-center gap-3 px-3 py-2.5 rounded-md border transition-all',
        isOver
          ? 'border-green-400 border-dashed bg-green-400/5'
          : assignment
            ? 'border-[#2a2a4a] bg-[#16213e]'
            : 'border-[#2a2a4a] border-dashed bg-[#0f0f23]/50',
      )}
    >
      {/* Role label */}
      <span className="font-mono text-xs text-gray-500 w-32 flex-shrink-0 truncate" title={slot.roleLabel}>
        {slot.roleLabel}
      </span>

      {/* Divider */}
      <span className="text-gray-700 flex-shrink-0">—</span>

      {/* Assigned person or empty indicator */}
      <span
        className={clsx(
          'flex-1 text-sm truncate',
          person ? 'text-gray-200 font-medium' : 'text-gray-600 italic',
        )}
      >
        {person ? (
          <>
            {person.rank && (
              <span className="text-green-400 text-xs font-normal mr-1">{person.rank}</span>
            )}
            {person.name}
          </>
        ) : (
          '[EMPTY]'
        )}
      </span>

      {/* Unassign button */}
      {assignment && (
        <button
          onClick={handleUnassign}
          className="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors p-0.5 rounded"
          aria-label={`Remove ${person?.name ?? 'person'} from ${slot.roleLabel}`}
          title="Remove assignment"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
