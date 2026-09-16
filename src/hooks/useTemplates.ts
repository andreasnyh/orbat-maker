import { useCallback, useEffect } from 'react';
import { defaultTemplates } from '../data/defaultTemplates';
import { mergeById } from '../lib/collections';
import { generateId } from '../lib/ids';
import { sanitizeTemplate } from '../lib/schema';
import type { Slot, Template } from '../types';
import { useStoredCollection } from './useStoredCollection';

/**
 * Compare a stored default against its source. Both sides go through the
 * sanitizer first so field order — which differs between a hand-written
 * literal and a record rebuilt on load — cannot fake a difference.
 */
function matchesSource(stored: Template, source: Template): boolean {
  return (
    JSON.stringify(sanitizeTemplate(stored)) ===
    JSON.stringify(sanitizeTemplate(source))
  );
}

export function useTemplates() {
  const [templates, setTemplates] = useStoredCollection('templates');

  // Seed missing defaults and sync existing ones with source data on every load
  useEffect(() => {
    setTemplates((prev) => {
      if (prev.length === 0) return defaultTemplates;
      const defaultById = new Map(defaultTemplates.map((d) => [d.id, d]));
      // Update existing defaults in-place, keep custom templates as-is
      let changed = false;
      const updated = prev.map((t) => {
        const source = defaultById.get(t.id);
        if (!source || matchesSource(t, source)) return t;
        changed = true;
        return source;
      });
      // Append any new defaults not yet present
      const existingIds = new Set(prev.map((t) => t.id));
      const missing = defaultTemplates.filter((d) => !existingIds.has(d.id));
      if (missing.length > 0) return [...updated, ...missing];
      // Returning prev unchanged keeps this effect from writing on every load.
      return changed ? updated : prev;
    });
  }, [setTemplates]);

  const addTemplate = useCallback(
    (name: string, description?: string) => {
      const template: Template = {
        id: generateId(),
        name,
        description,
        groups: [],
      };
      setTemplates((prev) => [...prev, template]);
      return template;
    },
    [setTemplates],
  );

  const updateTemplate = useCallback(
    (id: string, updates: Partial<Omit<Template, 'id'>>) => {
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      );
    },
    [setTemplates],
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      setTemplates((prev) => prev.filter((t) => t.isDefault || t.id !== id));
    },
    [setTemplates],
  );

  const duplicateTemplate = useCallback(
    (id: string): Template | null => {
      let result: Template | null = null;
      setTemplates((prev) => {
        const original = prev.find((t) => t.id === id);
        if (!original) return prev;
        const duplicate: Template = {
          ...structuredClone(original),
          id: generateId(),
          name: `${original.name} (Copy)`,
          isDefault: false,
        };
        // Generate new IDs for groups and slots
        duplicate.groups = duplicate.groups.map((g) => ({
          ...g,
          id: generateId(),
          slots: g.slots.map((s) => ({ ...s, id: generateId() })),
        }));
        result = duplicate;
        return [...prev, duplicate];
      });
      return result;
    },
    [setTemplates],
  );

  /** Fork a template preserving all group/slot IDs (so assignments remain valid). */
  const forkTemplate = useCallback(
    (id: string, newName: string): Template | null => {
      let result: Template | null = null;
      setTemplates((prev) => {
        const original = prev.find((t) => t.id === id);
        if (!original) return prev;
        const forked: Template = {
          ...structuredClone(original),
          id: generateId(),
          name: newName,
          isDefault: false,
        };
        result = forked;
        return [...prev, forked];
      });
      return result;
    },
    [setTemplates],
  );

  /** Update slots within a specific group of a specific template. */
  const updateGroupSlots = useCallback(
    (
      templateId: string,
      groupId: string,
      updater: (slots: Slot[]) => Slot[],
    ) => {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId
            ? {
                ...t,
                groups: t.groups.map((g) =>
                  g.id === groupId ? { ...g, slots: updater(g.slots) } : g,
                ),
              }
            : t,
        ),
      );
    },
    [setTemplates],
  );

  const addSlotToGroup = useCallback(
    (templateId: string, groupId: string, roleLabel: string): Slot => {
      const newSlot: Slot = { id: generateId(), roleLabel };
      updateGroupSlots(templateId, groupId, (slots) => [...slots, newSlot]);
      return newSlot;
    },
    [updateGroupSlots],
  );

  const removeSlotFromGroup = useCallback(
    (templateId: string, groupId: string, slotId: string) => {
      updateGroupSlots(templateId, groupId, (slots) =>
        slots.filter((s) => s.id !== slotId),
      );
    },
    [updateGroupSlots],
  );

  const updateSlot = useCallback(
    (
      templateId: string,
      groupId: string,
      slotId: string,
      updates: Partial<Omit<Slot, 'id'>>,
    ) => {
      updateGroupSlots(templateId, groupId, (slots) =>
        slots.map((s) => (s.id === slotId ? { ...s, ...updates } : s)),
      );
    },
    [updateGroupSlots],
  );

  const reorderSlotsInGroup = useCallback(
    (templateId: string, groupId: string, slots: Slot[]) => {
      updateGroupSlots(templateId, groupId, () => slots);
    },
    [updateGroupSlots],
  );

  const moveSlotBetweenGroups = useCallback(
    (
      templateId: string,
      fromGroupId: string,
      toGroupId: string,
      slotId: string,
      targetIndex: number,
    ) => {
      setTemplates((prev) =>
        prev.map((t) => {
          if (t.id !== templateId) return t;
          const fromGroup = t.groups.find((g) => g.id === fromGroupId);
          if (!fromGroup) return t;
          const slot = fromGroup.slots.find((s) => s.id === slotId);
          if (!slot) return t;
          return {
            ...t,
            groups: t.groups.map((g) => {
              if (g.id === fromGroupId) {
                return { ...g, slots: g.slots.filter((s) => s.id !== slotId) };
              }
              if (g.id === toGroupId) {
                const newSlots = [...g.slots];
                newSlots.splice(targetIndex, 0, slot);
                return { ...g, slots: newSlots };
              }
              return g;
            }),
          };
        }),
      );
    },
    [setTemplates],
  );

  /** Append records that are new by id — the import applier's way in. */
  const addTemplates = useCallback(
    (incoming: Template[]) => {
      setTemplates((prev) => mergeById(prev, incoming));
    },
    [setTemplates],
  );

  return {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    forkTemplate,
    addSlotToGroup,
    removeSlotFromGroup,
    reorderSlotsInGroup,
    moveSlotBetweenGroups,
    updateSlot,
    updateGroupSlots,
    addTemplates,
    setTemplates,
  };
}
