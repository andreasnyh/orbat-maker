import {
  ChevronDown,
  ClipboardList,
  FolderOpen,
  Plus,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  useOrbatsState,
  useTemplatesState,
} from '../../context/AppStateContext';
import type { Page } from '../../types';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Modal } from '../common/Modal';
import { TextInput } from '../common/TextInput';

interface OrbatListPageProps {
  onNavigate: (page: Page, id?: string) => void;
}

export function OrbatListPage({ onNavigate }: OrbatListPageProps) {
  const { orbats, createOrbat, deleteOrbat } = useOrbatsState();
  const { templates } = useTemplatesState();

  // ---- New ORBAT modal state -----------------------------------------------
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTemplateId, setNewTemplateId] = useState<string>('');
  // ---- Delete confirmation state -------------------------------------------
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ---- Handlers ------------------------------------------------------------

  function handleOpenNewModal() {
    // Pre-select first available template
    setNewTemplateId(templates[0]?.id ?? '');
    setShowNewModal(true);
  }

  function handleCloseNewModal() {
    setShowNewModal(false);
    setNewName('');
    setNewTemplateId('');
  }

  function handleCreateOrbat() {
    const trimmedName = newName.trim();
    if (!trimmedName || !newTemplateId) return;
    const template = templateMap.get(newTemplateId);
    if (!template) return;
    const created = createOrbat(trimmedName, template);
    handleCloseNewModal();
    onNavigate('orbat-builder', created.id);
  }

  function handleDeleteConfirm() {
    if (deleteTarget) {
      deleteOrbat(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  // ---- Derived helpers (memoized) -------------------------------------------

  const templateMap = useMemo(
    () => new Map(templates.map((t) => [t.id, t])),
    [templates],
  );

  const progressMap = useMemo(() => {
    const map = new Map<string, { filled: number; total: number }>();
    for (const o of orbats) {
      const t = templateMap.get(o.templateId);
      if (!t) {
        map.set(o.id, { filled: o.assignments.length, total: 0 });
      } else {
        const total = t.groups.reduce((sum, g) => sum + g.slots.length, 0);
        map.set(o.id, { filled: o.assignments.length, total });
      }
    }
    return map;
  }, [orbats, templateMap]);

  const canCreate = newName.trim().length > 0 && newTemplateId.length > 0;

  // ---- Render --------------------------------------------------------------

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-end mb-6">
        <Button
          onClick={handleOpenNewModal}
          variant="primary"
          size="md"
          disabled={templates.length === 0}
          title={templates.length === 0 ? 'Create a template first' : undefined}
        >
          <Plus size={16} />
          New ORBAT
        </Button>
      </div>

      {/* No templates warning */}
      {templates.length === 0 && (
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mb-6 text-yellow-300 text-sm">
          No templates available. Create a template before building an ORBAT.
        </div>
      )}

      {/* ORBAT grid */}
      {orbats.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orbats.map((orbat) => {
            const template = templateMap.get(orbat.templateId);
            const { filled, total } = progressMap.get(orbat.id) ?? {
              filled: 0,
              total: 0,
            };
            const progressPercent =
              total > 0 ? Math.round((filled / total) * 100) : 0;

            return (
              <div key={orbat.id} className="card p-4 flex flex-col gap-3">
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ClipboardList
                      size={16}
                      className="text-green-400 shrink-0 mt-0.5"
                    />
                    <span className="font-display font-semibold text-gray-200 truncate">
                      {orbat.name}
                    </span>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-col gap-1 text-xs text-gray-500">
                  <span className="text-gray-400 truncate">
                    {template ? (
                      template.name
                    ) : (
                      <span className="text-yellow-400/80">
                        Template missing
                      </span>
                    )}
                  </span>
                </div>

                {/* Assignment progress */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Assignments</span>
                    <span
                      className={`font-data ${
                        filled === total && total > 0
                          ? 'text-green-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {filled}/{total}
                    </span>
                  </div>
                  {total > 0 && (
                    <div className="h-1.5 bg-[#0f0f23] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Card actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#2a2a4a] mt-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onNavigate('orbat-builder', orbat.id)}
                    className="flex-1"
                  >
                    <FolderOpen size={13} />
                    Open
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      setDeleteTarget({ id: orbat.id, name: orbat.name })
                    }
                    title="Delete ORBAT"
                    aria-label="Delete ORBAT"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <ClipboardList size={48} className="text-gray-700" />
          <p className="text-gray-500 text-lg font-medium">No ORBATs yet</p>
          <p className="text-gray-600 text-sm max-w-xs">
            Create an ORBAT to start assigning people to roles from a template.
          </p>
          {templates.length > 0 && (
            <Button variant="primary" size="md" onClick={handleOpenNewModal}>
              <Plus size={16} />
              New ORBAT
            </Button>
          )}
        </div>
      )}

      {/* New ORBAT modal */}
      <Modal
        open={showNewModal}
        onClose={handleCloseNewModal}
        title="New ORBAT"
      >
        <div className="flex flex-col gap-4">
          <TextInput
            label="Name"
            placeholder="e.g. Alpha Company ORBAT…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canCreate) handleCreateOrbat();
            }}
            autoFocus
          />

          {/* Template picker */}
          <div className="flex flex-col gap-1">
            <label htmlFor="orbat-template" className="text-sm text-gray-400">
              Template
            </label>
            <div className="relative">
              <select
                id="orbat-template"
                value={newTemplateId}
                onChange={(e) => setNewTemplateId(e.target.value)}
                className="w-full bg-[#0f0f23] border border-[#2a2a4a] rounded-md px-3 py-2 pr-9 text-gray-200 text-sm
                           focus:outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/25
                           appearance-none cursor-pointer"
              >
                {templates.length === 0 && (
                  <option value="" disabled>
                    No templates available
                  </option>
                )}
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={handleCloseNewModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateOrbat}
              disabled={!canCreate}
            >
              Create & Open
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete ORBAT"
        message={`Delete "${deleteTarget?.name}"? All assignments will be lost. This cannot be undone.`}
        confirmLabel="Delete ORBAT"
      />
    </div>
  );
}
