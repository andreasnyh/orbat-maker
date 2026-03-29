import { ChevronsUp, Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRanksState } from '../../context/AppStateContext';
import { useToast } from '../../hooks/useToast';
import { useToggle } from '../../hooks/useToggle';
import type { Rank } from '../../types';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';
import { PageHeader } from '../common/PageHeader';
import { TextInput } from '../common/TextInput';
import { BulkAddRanksForm } from './BulkAddRanksForm';

function RankForm({
  onSubmit,
  onCancel,
  initialName = '',
  existingNames = [],
}: {
  onSubmit: (name: string) => void;
  onCancel: () => void;
  initialName?: string;
  existingNames?: string[];
}) {
  const [name, setName] = useState(initialName);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEdit = initialName !== '';

  const trimmed = name.trim();
  const isDuplicate =
    trimmed !== '' &&
    trimmed.toLowerCase() !== initialName.toLowerCase() &&
    existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase());
  const nameError = touched
    ? !trimmed
      ? 'Name is required'
      : isDuplicate
        ? 'Rank already exists'
        : undefined
    : undefined;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched(true);
    if (!trimmed || isDuplicate) return;
    onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextInput
        ref={inputRef}
        label="Rank abbreviation"
        placeholder="e.g. Sgt., Cpl., LCpl."
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={nameError}
        required
        autoComplete="off"
      />
      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {isEdit ? 'Save Changes' : 'Add Rank'}
        </Button>
      </div>
    </form>
  );
}

export function RanksPage() {
  const { ranks, addRank, updateRank, deleteRank, setRanks } = useRanksState();
  const toast = useToast();

  const rankNames = ranks.map((r) => r.name);
  const [isAddOpen, , setIsAddOpen] = useToggle();
  const [isBulkAddOpen, , setIsBulkAddOpen] = useToggle();
  const [editTarget, setEditTarget] = useState<Rank | null>(null);

  const handleAdd = (name: string) => {
    addRank(name);
    setIsAddOpen(false);
    toast.success(`Added ${name}`);
  };

  const handleBulkAdd = (names: string[]) => {
    for (const name of names) {
      addRank(name);
    }
    setIsBulkAddOpen(false);
    toast.success(`Added ${names.length} ranks`);
  };

  const handleEditSubmit = (name: string) => {
    if (!editTarget) return;
    updateRank(editTarget.id, { name });
    setEditTarget(null);
  };

  const handleDelete = (rank: Rank) => {
    const snapshot = rank;
    const index = ranks.indexOf(rank);
    deleteRank(rank.id);
    toast.undo(`Deleted "${rank.name}"`, () => {
      setRanks((prev) => {
        const restored = [...prev];
        restored.splice(Math.min(index, restored.length), 0, snapshot);
        return restored;
      });
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Ranks" count={ranks.length}>
        <Button variant="secondary" onClick={() => setIsBulkAddOpen(true)}>
          <UsersRound size={16} />
          Bulk Add
        </Button>
        <Button variant="primary" onClick={() => setIsAddOpen(true)}>
          <Plus size={16} />
          Add Rank
        </Button>
      </PageHeader>

      {/* Content */}
      {ranks.length === 0 ? (
        <EmptyState
          icon={ChevronsUp}
          title="No ranks defined"
          description="Define your unit's ranks once and select them when adding personnel."
        >
          <Button variant="primary" onClick={() => setIsAddOpen(true)}>
            <Plus size={16} />
            Add First Rank
          </Button>
        </EmptyState>
      ) : (
        <div className="border border-trim rounded-md divide-y divide-trim bg-panel/50">
          {ranks.map((rank) => (
            <div
              key={rank.id}
              className="flex items-center justify-between px-4 py-3 gap-3"
            >
              <span className="text-sm text-body font-medium">{rank.name}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditTarget(rank)}
                  className="p-1.5 rounded-md text-dim hover:text-accent hover:bg-overlay transition-colors"
                  aria-label={`Edit ${rank.name}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(rank)}
                  className="p-1.5 rounded-md text-dim hover:text-danger hover:bg-overlay transition-colors"
                  aria-label={`Delete ${rank.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      <Modal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Rank"
      >
        {isAddOpen && (
          <RankForm
            onSubmit={handleAdd}
            onCancel={() => setIsAddOpen(false)}
            existingNames={rankNames}
          />
        )}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Edit Rank"
      >
        {editTarget && (
          <RankForm
            key={editTarget.id}
            initialName={editTarget.name}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditTarget(null)}
            existingNames={rankNames}
          />
        )}
      </Modal>

      {/* Bulk add modal */}
      <Modal
        open={isBulkAddOpen}
        onClose={() => setIsBulkAddOpen(false)}
        title="Bulk Add Ranks"
      >
        <BulkAddRanksForm
          onSubmit={handleBulkAdd}
          onCancel={() => setIsBulkAddOpen(false)}
        />
      </Modal>
    </div>
  );
}
