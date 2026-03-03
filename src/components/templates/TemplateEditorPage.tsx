import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTemplatesState } from '../../context/AppStateContext';
import { generateId } from '../../lib/ids';
import type { Group, Page } from '../../types';
import { GroupEditor } from './GroupEditor';

interface TemplateEditorPageProps {
  templateId: string;
  onNavigate: (page: Page) => void;
}

// ---- Sortable wrapper for each group ----------------------------------------

interface SortableGroupProps {
  group: Group;
  onUpdate: (group: Group) => void;
  onDelete: () => void;
}

function SortableGroup({ group, onUpdate, onDelete }: SortableGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <GroupEditor
        group={group}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  );
}

// ---- TemplateEditorPage -----------------------------------------------------

export function TemplateEditorPage({
  templateId,
  onNavigate,
}: TemplateEditorPageProps) {
  const { templates, updateTemplate } = useTemplatesState();
  const template = templates.find((t) => t.id === templateId);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(template?.name ?? '');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(template?.description ?? '');

  const nameInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (editingDesc) {
      descInputRef.current?.focus();
      descInputRef.current?.select();
    }
  }, [editingDesc]);

  // Keep drafts in sync when template changes externally
  useEffect(() => {
    if (!editingName) setNameDraft(template?.name ?? '');
  }, [template?.name, editingName]);

  useEffect(() => {
    if (!editingDesc) setDescDraft(template?.description ?? '');
  }, [template?.description, editingDesc]);

  // ---- DnD sensors (must be before early return to satisfy rules-of-hooks) ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
  );

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-gray-400">Template not found.</p>
        <button
          type="button"
          onClick={() => onNavigate('templates')}
          className="text-green-400 hover:text-green-300 text-sm"
        >
          Back to Templates
        </button>
      </div>
    );
  }

  // After the guard, `t` carries the narrowed non-undefined type into closures.
  const t = template;

  // ---- Name editing ----------------------------------------------------------

  function commitName() {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== t.name) {
      updateTemplate(templateId, { name: trimmed });
    } else {
      setNameDraft(t.name);
    }
    setEditingName(false);
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setNameDraft(t.name);
      setEditingName(false);
    }
  }

  // ---- Description editing ---------------------------------------------------

  function commitDesc() {
    const trimmed = descDraft.trim();
    if (trimmed !== (t.description ?? '')) {
      updateTemplate(templateId, { description: trimmed || undefined });
    } else {
      setDescDraft(t.description ?? '');
    }
    setEditingDesc(false);
  }

  function handleDescKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitDesc();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setDescDraft(t.description ?? '');
      setEditingDesc(false);
    }
  }

  // ---- Group operations -------------------------------------------------------

  function addGroup() {
    const newGroup: Group = { id: generateId(), name: 'New Group', slots: [] };
    updateTemplate(templateId, {
      groups: [...t.groups, newGroup],
    });
  }

  function handleGroupUpdate(updated: Group) {
    updateTemplate(templateId, {
      groups: t.groups.map((g) => (g.id === updated.id ? updated : g)),
    });
  }

  function handleGroupDelete(groupId: string) {
    updateTemplate(templateId, {
      groups: t.groups.filter((g) => g.id !== groupId),
    });
  }

  function handleGroupDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = t.groups.findIndex((g) => g.id === active.id);
    const newIndex = t.groups.findIndex((g) => g.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    updateTemplate(templateId, {
      groups: arrayMove(t.groups, oldIndex, newIndex),
    });
  }

  // ---- Render -----------------------------------------------------------------

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back navigation */}
      <button
        onClick={() => onNavigate('templates')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-6 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/60 focus-visible:text-green-400"
        type="button"
      >
        <ArrowLeft size={16} />
        Templates
      </button>

      {/* Template header */}
      <div className="mb-6">
        {/* Name */}
        <div className="mb-1">
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={handleNameKeyDown}
              aria-label="Template name"
              className="w-full bg-[#0f0f23] border border-green-400/50 rounded-md px-3 py-1.5 text-2xl font-bold text-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-400/25"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="font-display text-2xl font-bold text-gray-100 uppercase tracking-wide cursor-text hover:text-white text-left"
              title="Click to edit name"
            >
              {template.name}
            </button>
          )}
        </div>

        {/* Description */}
        <div>
          {editingDesc ? (
            <input
              ref={descInputRef}
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={commitDesc}
              onKeyDown={handleDescKeyDown}
              placeholder="Add a description…"
              aria-label="Template description"
              className="w-full bg-[#0f0f23] border border-green-400/50 rounded-md px-3 py-1 text-sm text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-400/25"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingDesc(true)}
              className={`text-sm cursor-text hover:text-gray-300 transition-colors text-left ${
                template.description ? 'text-gray-400' : 'text-gray-600 italic'
              }`}
              title="Click to edit description"
            >
              {template.description ?? 'No description — click to add'}
            </button>
          )}
        </div>
      </div>

      {/* Groups section */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm font-semibold text-gray-400 uppercase tracking-widest">
          Groups
          <span className="ml-2 text-gray-600 normal-case font-normal font-data">
            ({template.groups.length})
          </span>
        </h2>
      </div>

      {/* Groups list with drag-and-drop */}
      {template.groups.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleGroupDragEnd}
        >
          <SortableContext
            items={template.groups.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3">
              {template.groups.map((group) => (
                <SortableGroup
                  key={group.id}
                  group={group}
                  onUpdate={handleGroupUpdate}
                  onDelete={() => handleGroupDelete(group.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg py-10 text-center mb-3">
          <p className="text-gray-500 text-sm mb-1">No groups yet</p>
          <p className="text-gray-600 text-xs">
            Add a group to start building your template
          </p>
        </div>
      )}

      {/* Add Group button */}
      <div className="mt-4">
        <button
          onClick={addGroup}
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-[#2a2a4a] text-sm text-green-400 hover:text-green-300 hover:border-green-400/40 transition-colors w-full justify-center"
        >
          <Plus size={16} />
          Add Group
        </button>
      </div>
    </div>
  );
}
