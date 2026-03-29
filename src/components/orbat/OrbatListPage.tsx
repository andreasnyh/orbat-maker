import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUp,
  ClipboardList,
  FolderOpen,
  LayoutTemplate,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  useOrbatsState,
  usePeopleState,
  useRanksState,
  useTemplatesState,
} from '../../context/AppStateContext';
import { useToast } from '../../hooks/useToast';
import { useToggle } from '../../hooks/useToggle';
import type { ORBAT, Page } from '../../types';
import { AlertBanner } from '../common/AlertBanner';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { PageHeader } from '../common/PageHeader';
import { TextInput } from '../common/TextInput';

interface OrbatListPageProps {
  onNavigate: (page: Page, id?: string) => void;
}

export function OrbatListPage({ onNavigate }: OrbatListPageProps) {
  const { orbats, createOrbat, deleteOrbat, setOrbats } = useOrbatsState();
  const { templates } = useTemplatesState();
  const { ranks } = useRanksState();
  const { people } = usePeopleState();
  const toast = useToast();

  // ---- New ORBAT modal state -----------------------------------------------
  const [showNewModal, , setShowNewModal] = useToggle();
  const [newName, setNewName] = useState('');
  const [newTemplateId, setNewTemplateId] = useState<string>('');
  const [newTouched, setNewTouched] = useState(false);

  const newNameError =
    newTouched && !newName.trim() ? 'Name is required' : undefined;

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
    setNewTouched(false);
  }

  function handleCreateOrbat() {
    setNewTouched(true);
    const trimmedName = newName.trim();
    if (!trimmedName || !newTemplateId) return;
    const template = templateMap.get(newTemplateId);
    if (!template) return;
    const created = createOrbat(trimmedName, template);
    handleCloseNewModal();
    onNavigate('orbat-builder', created.id);
  }

  function handleDelete(orbat: ORBAT) {
    const snapshot = orbat;
    const index = orbats.indexOf(orbat);
    deleteOrbat(orbat.id);
    toast.undo(`Deleted "${orbat.name}"`, () => {
      setOrbats((prev) => {
        const restored = [...prev];
        restored.splice(Math.min(index, restored.length), 0, snapshot);
        return restored;
      });
    });
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

  // ---- Render --------------------------------------------------------------

  return (
    <div>
      <PageHeader title="ORBATs" count={orbats.length} className="mb-6">
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
      </PageHeader>

      {/* No templates warning */}
      {templates.length === 0 && (
        <AlertBanner variant="warning" className="mb-6">
          No templates available. Create a template before building an ORBAT.
        </AlertBanner>
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
                      className="text-accent shrink-0 mt-0.5"
                    />
                    <span className="font-display font-semibold text-body truncate">
                      {orbat.name}
                    </span>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-col gap-1 text-xs text-dim">
                  <span className="text-dim truncate">
                    {template ? (
                      template.name
                    ) : (
                      <span className="text-warning">Template missing</span>
                    )}
                  </span>
                </div>

                {/* Assignment progress */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dim">Assignments</span>
                    <span
                      className={`font-data ${
                        filled === total && total > 0
                          ? 'text-accent'
                          : 'text-dim'
                      }`}
                    >
                      {filled}/{total}
                    </span>
                  </div>
                  {total > 0 && (
                    <div className="h-1.5 bg-page rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full transition-all motion-reduce:transition-none"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Card actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-trim mt-auto">
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
                    onClick={() => handleDelete(orbat)}
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
        /* Empty state — workflow checklist */
        <div className="max-w-md mx-auto py-16">
          <p className="text-dim text-sm mb-5 text-center">
            Set up your data, then build an ORBAT.
          </p>

          <ol className="flex flex-col gap-1">
            {[
              {
                label: 'Define ranks',
                page: 'ranks' as Page,
                icon: ChevronsUp,
                done: ranks.length > 0,
                optional: true,
              },
              {
                label: 'Add personnel',
                page: 'people' as Page,
                icon: Users,
                done: people.length > 0,
                optional: false,
              },
              {
                label: 'Customize a template',
                page: 'templates' as Page,
                icon: LayoutTemplate,
                done: templates.some((t) => !t.isDefault),
                optional: false,
              },
            ].map((step, i) => (
              <li key={step.page}>
                <button
                  type="button"
                  onClick={() => onNavigate(step.page)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm transition-colors
                    ${step.done ? 'text-dim' : 'text-body hover:bg-trim/30'}`}
                >
                  {/* Step number / check */}
                  <span
                    className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-data font-semibold
                      ${step.done ? 'bg-success-dim text-success' : 'bg-panel border border-trim text-dim'}`}
                  >
                    {step.done ? <Check size={13} /> : i + 1}
                  </span>

                  <step.icon
                    size={15}
                    className={step.done ? 'text-chrome' : 'text-accent'}
                  />
                  <span
                    className={
                      step.done ? 'line-through decoration-trim' : 'font-medium'
                    }
                  >
                    {step.label}
                  </span>
                  {step.optional && !step.done && (
                    <span className="text-xs text-dim italic">Optional</span>
                  )}

                  <ChevronRight size={14} className="ml-auto text-chrome" />
                </button>
              </li>
            ))}

            {/* Final step: Build ORBAT — only active when prerequisites met */}
            <li className="mt-2 pt-2 border-t border-trim">
              <button
                type="button"
                onClick={templates.length > 0 ? handleOpenNewModal : undefined}
                disabled={templates.length === 0}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm transition-colors
                  ${templates.length > 0 ? 'text-body hover:bg-trim/30' : 'text-chrome cursor-not-allowed'}`}
              >
                <span
                  className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-data font-semibold
                    ${templates.length > 0 ? 'bg-accent/20 text-accent' : 'bg-panel border border-trim text-chrome'}`}
                >
                  4
                </span>
                <ClipboardList
                  size={15}
                  className={
                    templates.length > 0 ? 'text-accent' : 'text-chrome'
                  }
                />
                <span className={templates.length > 0 ? 'font-medium' : ''}>
                  Build ORBAT
                </span>
                {templates.length > 0 && (
                  <ChevronRight size={14} className="ml-auto text-chrome" />
                )}
              </button>
            </li>
          </ol>
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
              if (e.key === 'Enter') handleCreateOrbat();
            }}
            error={newNameError}
            autoFocus
          />

          {/* Template picker */}
          <div className="flex flex-col gap-1">
            <label htmlFor="orbat-template" className="text-sm text-dim">
              Template
            </label>
            <div className="relative">
              <select
                id="orbat-template"
                value={newTemplateId}
                onChange={(e) => setNewTemplateId(e.target.value)}
                className="w-full bg-page border border-trim rounded-md px-3 py-2 pr-9 text-body text-sm
                           focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={handleCloseNewModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateOrbat}>
              Create & Open
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
