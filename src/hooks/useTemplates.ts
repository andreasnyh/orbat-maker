import { useCallback, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { generateId } from '../lib/ids'
import { defaultTemplates } from '../data/defaultTemplates'
import type { Template } from '../types'

const STORAGE_KEY = 'orbat-maker:templates'

export function useTemplates() {
  const [templates, setTemplates] = useLocalStorage<Template[]>(STORAGE_KEY, [])

  // Seed defaults on first load
  useEffect(() => {
    setTemplates(prev => prev.length === 0 ? defaultTemplates : prev)
  }, [setTemplates])

  const addTemplate = useCallback(
    (name: string, description?: string) => {
      const template: Template = { id: generateId(), name, description, groups: [] }
      setTemplates(prev => [...prev, template])
      return template
    },
    [setTemplates],
  )

  const updateTemplate = useCallback(
    (id: string, updates: Partial<Omit<Template, 'id'>>) => {
      setTemplates(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)))
    },
    [setTemplates],
  )

  const deleteTemplate = useCallback(
    (id: string) => {
      setTemplates(prev => prev.filter(t => t.isDefault || t.id !== id))
    },
    [setTemplates],
  )

  const duplicateTemplate = useCallback(
    (id: string) => {
      const original = templates.find(t => t.id === id)
      if (!original) return null
      const duplicate: Template = {
        ...structuredClone(original),
        id: generateId(),
        name: `${original.name} (Copy)`,
        isDefault: false,
      }
      // Generate new IDs for groups and slots
      duplicate.groups = duplicate.groups.map(g => ({
        ...g,
        id: generateId(),
        slots: g.slots.map(s => ({ ...s, id: generateId() })),
      }))
      setTemplates(prev => [...prev, duplicate])
      return duplicate
    },
    [templates, setTemplates],
  )

  return { templates, addTemplate, updateTemplate, deleteTemplate, duplicateTemplate, setTemplates }
}
