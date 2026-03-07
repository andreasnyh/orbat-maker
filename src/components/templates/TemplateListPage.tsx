import { Copy, LayoutTemplate, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTemplatesState } from '../../context/AppStateContext';
import type { Page } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Modal } from '../common/Modal';
import { TextInput } from '../common/TextInput';

interface TemplateListPageProps {
  onNavigate: (page: Page, id?: string) => void;
}

export function TemplateListPage({ onNavigate }: TemplateListPageProps) {
  const { templates, addTemplate, deleteTemplate, duplicateTemplate } =
    useTemplatesState();

  // ---- New template modal state ---------------------------------------------
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // ---- Delete confirmation state --------------------------------------------
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ---- Handlers -------------------------------------------------------------

  function handleCreateTemplate() {
    const trimmedName = newName.trim();
    if (!trimmedName) return;
    const created = addTemplate(trimmedName, newDesc.trim() || undefined);
    setShowNewModal(false);
    setNewName('');
    setNewDesc('');
    // Navigate directly into the editor for the new template
    onNavigate('template-editor', created.id);
  }

  function handleCloseNewModal() {
    setShowNewModal(false);
    setNewName('');
    setNewDesc('');
  }

  function handleDuplicate(id: string) {
    duplicateTemplate(id);
  }

  function handleDeleteConfirm() {
    if (deleteTarget) {
      deleteTemplate(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  // ---- Derived stats --------------------------------------------------------

  function templateStats(templateId: string) {
    const t = templates.find((t) => t.id === templateId);
    if (!t) return { groups: 0, slots: 0 };
    const slots = t.groups.reduce((sum, g) => sum + g.slots.length, 0);
    return { groups: t.groups.length, slots };
  }

  // ---- Render ---------------------------------------------------------------

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-end mb-6">
        <Button
          onClick={() => setShowNewModal(true)}
          variant="primary"
          size="md"
        >
          <Plus size={16} />
          New Template
        </Button>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const { groups, slots } = templateStats(template.id);
          return (
            <div key={template.id} className="card p-4 flex flex-col gap-3">
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <LayoutTemplate
                    size={16}
                    className="text-indigo-400 shrink-0 mt-0.5"
                  />
                  <span className="font-display font-semibold text-gray-200 truncate">
                    {template.name}
                  </span>
                </div>
                {template.isDefault && <Badge variant="indigo">Default</Badge>}
              </div>

              {/* Description */}
              {template.description && (
                <p className="text-sm text-gray-400 line-clamp-2">
                  {template.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-gray-500 font-data">
                <span>
                  {groups} {groups === 1 ? 'group' : 'groups'}
                </span>
                <span className="text-gray-700">·</span>
                <span>
                  {slots} {slots === 1 ? 'slot' : 'slots'}
                </span>
              </div>

              {/* Card actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#2a2a4a] mt-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('template-editor', template.id)}
                  className="flex-1"
                >
                  <Pencil size={13} />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicate(template.id)}
                  title="Duplicate template"
                  aria-label="Duplicate template"
                >
                  <Copy size={13} />
                </Button>
                {!template.isDefault && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      setDeleteTarget({ id: template.id, name: template.name })
                    }
                    title="Delete template"
                    aria-label="Delete template"
                  >
                    <Trash2 size={13} />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Template modal */}
      <Modal
        open={showNewModal}
        onClose={handleCloseNewModal}
        title="New Template"
      >
        <div className="flex flex-col gap-4">
          <TextInput
            label="Name"
            placeholder="e.g. Fire Team, Squad, Platoon…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateTemplate();
            }}
            autoFocus
          />
          <TextInput
            label="Description (optional)"
            placeholder="Brief description of this template"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateTemplate();
            }}
          />
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={handleCloseNewModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateTemplate}
              disabled={!newName.trim()}
            >
              Create & Edit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Template"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete Template"
      />
    </div>
  );
}
