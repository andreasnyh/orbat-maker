import { UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import type { Person } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Modal } from '../common/Modal';
import { TextInput } from '../common/TextInput';
import { PersonForm } from './PersonForm';
import { PersonList } from './PersonList';

export function PeopleRosterPage() {
  const { people, addPerson, updatePerson, deletePerson } = useAppState();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Person | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);

  const filteredPeople = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return people;
    return people.filter((p) => p.name.toLowerCase().includes(query));
  }, [people, search]);

  const handleAdd = (name: string, rank?: string) => {
    addPerson(name, rank);
    setIsAddModalOpen(false);
  };

  const handleEditOpen = (person: Person) => {
    setEditTarget(person);
  };

  const handleEditSubmit = (name: string, rank?: string) => {
    if (!editTarget) return;
    updatePerson(editTarget.id, { name, rank: rank ?? undefined });
    setEditTarget(null);
  };

  const handleDeleteOpen = (person: Person) => {
    setDeleteTarget(person);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deletePerson(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-200">People Roster</h1>
          <Badge variant="default">{people.length}</Badge>
        </div>
        <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus size={16} />
          Add Person
        </Button>
      </div>

      {/* Search bar — only show once there are people to filter */}
      {people.length > 0 && (
        <TextInput
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search people"
        />
      )}

      {/* Content */}
      {people.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Users size={48} className="text-gray-600" />
          <div className="flex flex-col gap-1">
            <p className="text-gray-300 font-medium">No people yet</p>
            <p className="text-gray-500 text-sm max-w-xs">
              Add your first person to the roster and they will be available to
              assign to ORBAT slots.
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus size={16} />
            Add First Person
          </Button>
        </div>
      ) : filteredPeople.length === 0 ? (
        /* Search no-results state */
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-gray-400 font-medium">No results for "{search}"</p>
          <p className="text-gray-500 text-sm">
            Try a different name or clear the search.
          </p>
        </div>
      ) : (
        <PersonList
          people={filteredPeople}
          onEdit={handleEditOpen}
          onDelete={handleDeleteOpen}
        />
      )}

      {/* Add modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Person"
      >
        <PersonForm
          onSubmit={handleAdd}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Edit Person"
      >
        {editTarget && (
          <PersonForm
            key={editTarget.id}
            initialName={editTarget.name}
            initialRank={editTarget.rank ?? ''}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Person"
        message={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.rank ? `${deleteTarget.rank} ` : ''}${deleteTarget.name}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
