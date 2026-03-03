import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppState } from '../../context/AppStateContext'
import { generateId } from '../../lib/ids'
import { GroupEditor } from './GroupEditor'
import type { Page, Group } from '../../types'

interface TemplateEditorPageProps {
  templateId: string
  onNavigate: (page: Page) => void
}

// ---- Sortable wrapper for each group ----------------------------------------

interface SortableGroupProps {
  group: Group
  onUpdate: (group: Group) => void
  onDelete: () => void
}

function SortableGroup({ group, onUpdate, onDelete }: SortableGroupProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: group.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <GroupEditor
        group={group}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  )
}

// ---- TemplateEditorPage -----------------------------------------------------

export function TemplateEditorPage({ templateId, onNavigate }: TemplateEditorPageProps) {
  const { templates, updateTemplate } = useAppState()
  const template = templates.find(t => t.id === templateId)

  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(template?.name ?? '')
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState(template?.description ?? '')

  const nameInputRef = useRef<HTMLInputElement>(null)
  const descInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }
  }, [editingName])

  useEffect(() => {
    if (editingDesc) {
      descInputRef.current?.focus()
      descInputRef.current?.select()
    }
  }, [editingDesc])

  // Keep drafts in sync when template changes externally
  useEffect(() => {
    if (!editingName) setNameDraft(template?.name ?? '')
  }, [template?.name, editingName])

  useEffect(() => {
    if (!editingDesc) setDescDraft(template?.description ?? '')
  }, [template?.description, editingDesc])

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-gray-400">Template not found.</p>
        <button
          onClick={() => onNavigate('templates')}
          className="text-green-400 hover:text-green-300 text-sm"
        >
          Back to Templates
        </button>
      </div>
    )
  }

  // ---- Name editing ----------------------------------------------------------

  function commitName() {
    const trimmed = nameDraft.trim()
    if (trimmed && trimmed !== template!.name) {
      updateTemplate(templateId, { name: trimmed })
    } else {
      setNameDraft(template!.name)
    }
    setEditingName(false)
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); commitName() }
    else if (e.key === 'Escape') { e.preventDefault(); setNameDraft(template!.name); setEditingName(false) }
  }

  // ---- Description editing ---------------------------------------------------

  function commitDesc() {
    const trimmed = descDraft.trim()
    if (trimmed !== (template!.description ?? '')) {
      updateTemplate(templateId, { description: trimmed || undefined })
    } else {
      setDescDraft(template!.description ?? '')
    }
    setEditingDesc(false)
  }

  function handleDescKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); commitDesc() }
    else if (e.key === 'Escape') { e.preventDefault(); setDescDraft(template!.description ?? ''); setEditingDesc(false) }
  }

  // ---- Group operations -------------------------------------------------------

  function addGroup() {
    const newGroup: Group = { id: generateId(), name: 'New Group', slots: [] }
    updateTemplate(templateId, { groups: [...template!.groups, newGroup] })
  }

  function handleGroupUpdate(updated: Group) {
    updateTemplate(templateId, {
      groups: template!.groups.map(g => (g.id === updated.id ? updated : g)),
    })
  }

  function handleGroupDelete(groupId: string) {
    updateTemplate(templateId, {
      groups: template!.groups.filter(g => g.id !== groupId),
    })
  }

  function handleGroupDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = template!.groups.findIndex(g => g.id === active.id)
    const newIndex = template!.groups.findIndex(g => g.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    updateTemplate(templateId, { groups: arrayMove(template!.groups, oldIndex, newIndex) })
  }

  // ---- DnD sensors ---------------------------------------------------------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
  )

  // ---- Render -----------------------------------------------------------------

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back navigation */}
      <button
        onClick={() => onNavigate('templates')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-6"
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
              onChange={e => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={handleNameKeyDown}
              className="w-full bg-[#0f0f23] border border-green-400/50 rounded-md px-3 py-1.5 text-2xl font-bold text-gray-100 focus:outline-none focus:ring-1 focus:ring-green-400/25"
            />
          ) : (
            <h1
              role="button"
              tabIndex={0}
              onClick={() => setEditingName(true)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setEditingName(true) }}
              className="text-2xl font-bold text-gray-100 cursor-text hover:text-white"
              title="Click to edit name"
            >
              {template.name}
            </h1>
          )}
        </div>

        {/* Description */}
        <div>
          {editingDesc ? (
            <input
              ref={descInputRef}
              value={descDraft}
              onChange={e => setDescDraft(e.target.value)}
              onBlur={commitDesc}
              onKeyDown={handleDescKeyDown}
              placeholder="Add a description…"
              className="w-full bg-[#0f0f23] border border-green-400/50 rounded-md px-3 py-1 text-sm text-gray-400 focus:outline-none focus:ring-1 focus:ring-green-400/25"
            />
          ) : (
            <p
              role="button"
              tabIndex={0}
              onClick={() => setEditingDesc(true)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setEditingDesc(true) }}
              className={`text-sm cursor-text hover:text-gray-300 transition-colors ${
                template.description ? 'text-gray-400' : 'text-gray-600 italic'
              }`}
              title="Click to edit description"
            >
              {template.description ?? 'No description — click to add'}
            </p>
          )}
        </div>
      </div>

      {/* Groups section */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Groups
          <span className="ml-2 text-gray-600 normal-case font-normal">
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
            items={template.groups.map(g => g.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3">
              {template.groups.map(group => (
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
          <p className="text-gray-600 text-xs">Add a group to start building your template</p>
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
  )
}
