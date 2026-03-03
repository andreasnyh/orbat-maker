import { PersonCard } from './PersonCard'
import type { Person } from '../../types'

interface PersonListProps {
  people: Person[]
  onEdit: (person: Person) => void
  onDelete: (person: Person) => void
}

export function PersonList({ people, onEdit, onDelete }: PersonListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {people.map(person => (
        <PersonCard
          key={person.id}
          person={person}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
