import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { generateId } from '../lib/ids'
import type { ORBAT, Template } from '../types'

const STORAGE_KEY = 'orbat-maker:orbats'

export function useOrbats() {
  const [orbats, setOrbats] = useLocalStorage<ORBAT[]>(STORAGE_KEY, [])

  const createOrbat = useCallback(
    (name: string, template: Template, date?: string) => {
      const orbat: ORBAT = {
        id: generateId(),
        name,
        templateId: template.id,
        date,
        assignments: [],
      }
      setOrbats(prev => [...prev, orbat])
      return orbat
    },
    [setOrbats],
  )

  const updateOrbat = useCallback(
    (id: string, updates: Partial<Omit<ORBAT, 'id'>>) => {
      setOrbats(prev => prev.map(o => (o.id === id ? { ...o, ...updates } : o)))
    },
    [setOrbats],
  )

  const deleteOrbat = useCallback(
    (id: string) => {
      setOrbats(prev => prev.filter(o => o.id !== id))
    },
    [setOrbats],
  )

  const assignPersonToSlot = useCallback(
    (orbatId: string, slotId: string, personId: string) => {
      setOrbats(prev =>
        prev.map(o => {
          if (o.id !== orbatId) return o
          // Remove any existing assignment for this person OR this slot, then add the new one
          const filtered = o.assignments.filter(
            a => a.personId !== personId && a.slotId !== slotId,
          )
          return { ...o, assignments: [...filtered, { slotId, personId }] }
        }),
      )
    },
    [setOrbats],
  )

  const unassignSlot = useCallback(
    (orbatId: string, slotId: string) => {
      setOrbats(prev =>
        prev.map(o => {
          if (o.id !== orbatId) return o
          return { ...o, assignments: o.assignments.filter(a => a.slotId !== slotId) }
        }),
      )
    },
    [setOrbats],
  )

  return { orbats, createOrbat, updateOrbat, deleteOrbat, assignPersonToSlot, unassignSlot, setOrbats }
}
