import { ChevronsUp, Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRanksState } from '../../context/AppStateContext';
import type { Rank } from '../../types';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Modal } from '../common/Modal';
import { TextInput } from '../common/TextInput';
import { BulkAddRanksForm } from './BulkAddRanksForm';

function RankForm({
  onSubmit,
  onCancel,
  initialName = '',
}: {
  onSubmit: (name: string) => void;
  onCancel: () => void;
  initialName?: string;
}) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEdit = initialName !== '';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
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
        required
        autoComplete="off"
      />
      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!name.trim()}>
          {isEdit ? 'Save Changes' : 'Add Rank'}
        </Button>
      </div>
    </form>
  );
}

export function RanksPage() {
  const { ranks, addRank, updateRank, deleteRank } = useRanksState();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Rank | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Rank | null>(null);

  const handleAdd = (name: string) => {
    addRank(name);
    setIsAddOpen(false);
  };

  const handleBulkAdd = (names: string[]) => {
    for (const name of names) {
      addRank(name);
    }
    setIsBulkAddOpen(false);
  };

  const handleEditSubmit = (name: string) => {
    if (!editTarget) return;
    updateRank(editTarget.id, { name });
    setEditTarget(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteRank(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-end gap-3 flex-wrap">
        <Button variant="secondary" onClick={() => setIsBulkAddOpen(true)}>
          <UsersRound size={16} />
          Bulk Add
        </Button>
        <Button variant="primary" onClick={() => setIsAddOpen(true)}>
          <Plus size={16} />
          Add Rank
        </Button>
      </div>

      {/* Content */}
      {ranks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <ChevronsUp size={48} className="text-gray-600" />
          <div className="flex flex-col gap-1">
            <p className="text-gray-300 font-medium">No ranks defined</p>
            <p className="text-gray-400 text-sm max-w-xs">
              Define your unit's ranks once and select them when adding
              personnel.
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsAddOpen(true)}>
            <Plus size={16} />
            Add First Rank
          </Button>
        </div>
      ) : (
        <div className="border border-[#2a2a4a] rounded-md divide-y divide-[#2a2a4a] bg-[#1a1a2e]/50">
          {ranks.map((rank) => (
            <div
              key={rank.id}
              className="flex items-center justify-between px-4 py-3 gap-3"
            >
              <span className="text-sm text-gray-200 font-medium">
                {rank.name}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditTarget(rank)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-green-400 hover:bg-white/5 transition-colors"
                  aria-label={`Edit ${rank.name}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(rank)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
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
        <RankForm onSubmit={handleAdd} onCancel={() => setIsAddOpen(false)} />
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

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Rank"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
