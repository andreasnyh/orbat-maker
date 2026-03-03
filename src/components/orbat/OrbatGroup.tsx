import { OrbatSlot } from './OrbatSlot'
import type { Group, Assignment, Person } from '../../types'

interface OrbatGroupProps {
  group: Group
  assignments: Assignment[]
  people: Person[]
  orbatId: string
}

export function OrbatGroup({ group, assignments, people, orbatId }: OrbatGroupProps) {
  const filledCount = group.slots.filter(slot =>
    assignments.some(a => a.slotId === slot.id),
  ).length

  return (
    <div className="flex flex-col gap-2">
      {/* Group header */}
      <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
          {group.name}
        </h3>
        <span className="text-xs text-gray-600">
          {filledCount}/{group.slots.length}
        </span>
      </div>

      {/* Slots */}
      <div className="flex flex-col gap-1.5">
        {group.slots.map(slot => {
          const assignment = assignments.find(a => a.slotId === slot.id)
          const person = assignment
            ? people.find(p => p.id === assignment.personId)
            : undefined

          return (
            <OrbatSlot
              key={slot.id}
              slot={slot}
              assignment={assignment}
              person={person}
              orbatId={orbatId}
            />
          )
        })}

        {group.slots.length === 0 && (
          <p className="text-xs text-gray-600 italic px-3 py-2">No slots in this group.</p>
        )}
      </div>
    </div>
  )
}
