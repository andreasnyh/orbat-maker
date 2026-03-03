import { ClipboardList, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import type { Page, Template } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Modal } from '../common/Modal';
import { TextInput } from '../common/TextInput';

interface OrbatListPageProps {
  onNavigate: (page: Page, id?: string) => void;
}

export function OrbatListPage({ onNavigate }: OrbatListPageProps) {
  const { orbats, templates, createOrbat, deleteOrbat } = useAppState();

  // ---- New ORBAT modal state -----------------------------------------------
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTemplateId, setNewTemplateId] = useState<string>('');
  const [newDate, setNewDate] = useState('');

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
    setNewDate('');
  }

  function handleCreateOrbat() {
    const trimmedName = newName.trim();
    if (!trimmedName || !newTemplateId) return;
    const template = templates.find((t) => t.id === newTemplateId);
    if (!template) return;
    const created = createOrbat(trimmedName, template, newDate || undefined);
    handleCloseNewModal();
    onNavigate('orbat-builder', created.id);
  }

  function handleDeleteConfirm() {
    if (deleteTarget) {
      deleteOrbat(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  // ---- Derived helpers -----------------------------------------------------

  function getTemplate(templateId: string): Template | undefined {
    return templates.find((t) => t.id === templateId);
  }

  function getAssignmentProgress(orbatId: string): {
    filled: number;
    total: number;
  } {
    const orbat = orbats.find((o) => o.id === orbatId);
    if (!orbat) return { filled: 0, total: 0 };
    const template = getTemplate(orbat.templateId);
    if (!template) return { filled: orbat.assignments.length, total: 0 };
    const total = template.groups.reduce((sum, g) => sum + g.slots.length, 0);
    return { filled: orbat.assignments.length, total };
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    // Parse the YYYY-MM-DD string in local time to avoid timezone offset issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const canCreate = newName.trim().length > 0 && newTemplateId.length > 0;

  // ---- Render --------------------------------------------------------------

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-gray-100 uppercase tracking-wide">
            ORBATs
          </h1>
          <Badge variant="default">{orbats.length}</Badge>
        </div>
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
            const template = getTemplate(orbat.templateId);
            const { filled, total } = getAssignmentProgress(orbat.id);
            const progressPercent =
              total > 0 ? Math.round((filled / total) * 100) : 0;

            return (
              <div
                key={orbat.id}
                className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg p-4 flex flex-col gap-3 hover:border-[#3a3a5a] transition-colors"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ClipboardList
                      size={16}
                      className="text-green-400 flex-shrink-0 mt-0.5"
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
                  {orbat.date && <span>{formatDate(orbat.date)}</span>}
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
            <select
              id="orbat-template"
              value={newTemplateId}
              onChange={(e) => setNewTemplateId(e.target.value)}
              className="bg-[#0f0f23] border border-[#2a2a4a] rounded-md px-3 py-2 text-gray-200 text-sm
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
          </div>

          <TextInput
            label="Date (optional)"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />

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
