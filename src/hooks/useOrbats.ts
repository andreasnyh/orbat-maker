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

  const swapSlotAssignments = useCallback(
    (orbatId: string, slotIdA: string, slotIdB: string) => {
      setOrbats(prev =>
        prev.map(o => {
          if (o.id !== orbatId) return o
          const assignA = o.assignments.find(a => a.slotId === slotIdA)
          const assignB = o.assignments.find(a => a.slotId === slotIdB)
          // Build new assignments with the two slots swapped
          const updated = o.assignments.map(a => {
            if (a.slotId === slotIdA && assignB) return { slotId: slotIdA, personId: assignB.personId }
            if (a.slotId === slotIdB && assignA) return { slotId: slotIdB, personId: assignA.personId }
            return a
          })
          return { ...o, assignments: updated }
        }),
      )
    },
    [setOrbats],
  )

  const movePersonToSlot = useCallback(
    (orbatId: string, sourceSlotId: string, targetSlotId: string) => {
      setOrbats(prev =>
        prev.map(o => {
          if (o.id !== orbatId) return o
          const assignment = o.assignments.find(a => a.slotId === sourceSlotId)
          if (!assignment) return o
          // Remove from source, assign to target
          const filtered = o.assignments.filter(a => a.slotId !== sourceSlotId)
          return { ...o, assignments: [...filtered, { slotId: targetSlotId, personId: assignment.personId }] }
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

  return { orbats, createOrbat, updateOrbat, deleteOrbat, assignPersonToSlot, swapSlotAssignments, movePersonToSlot, unassignSlot, setOrbats }
}
