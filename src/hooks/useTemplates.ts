import { useCallback, useEffect } from 'react';
import { defaultTemplates } from '../data/defaultTemplates';
import { generateId } from '../lib/ids';
import type { Slot, Template } from '../types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'orbat-maker:templates';

export function useTemplates() {
  const [templates, setTemplates] = useLocalStorage<Template[]>(
    STORAGE_KEY,
    [],
  );

  // Seed missing defaults and sync existing ones with source data on every load
  useEffect(() => {
    setTemplates((prev) => {
      if (prev.length === 0) return defaultTemplates;
      const defaultById = new Map(defaultTemplates.map((d) => [d.id, d]));
      // Update existing defaults in-place, keep custom templates as-is
      const updated = prev.map((t) => defaultById.get(t.id) ?? t);
      // Append any new defaults not yet present
      const existingIds = new Set(prev.map((t) => t.id));
      const missing = defaultTemplates.filter((d) => !existingIds.has(d.id));
      return missing.length > 0 ? [...updated, ...missing] : updated;
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

  const addSlotToGroup = useCallback(
    (templateId: string, groupId: string, roleLabel: string): Slot => {
      const newSlot: Slot = { id: generateId(), roleLabel };
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId
            ? {
                ...t,
                groups: t.groups.map((g) =>
                  g.id === groupId ? { ...g, slots: [...g.slots, newSlot] } : g,
                ),
              }
            : t,
        ),
      );
      return newSlot;
    },
    [setTemplates],
  );

  const removeSlotFromGroup = useCallback(
    (templateId: string, groupId: string, slotId: string) => {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId
            ? {
                ...t,
                groups: t.groups.map((g) =>
                  g.id === groupId
                    ? { ...g, slots: g.slots.filter((s) => s.id !== slotId) }
                    : g,
                ),
              }
            : t,
        ),
      );
    },
    [setTemplates],
  );

  const updateSlot = useCallback(
    (
      templateId: string,
      groupId: string,
      slotId: string,
      updates: Partial<Omit<Slot, 'id'>>,
    ) => {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId
            ? {
                ...t,
                groups: t.groups.map((g) =>
                  g.id === groupId
                    ? {
                        ...g,
                        slots: g.slots.map((s) =>
                          s.id === slotId ? { ...s, ...updates } : s,
                        ),
                      }
                    : g,
                ),
              }
            : t,
        ),
      );
    },
    [setTemplates],
  );

  const reorderSlotsInGroup = useCallback(
    (templateId: string, groupId: string, slots: Slot[]) => {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId
            ? {
                ...t,
                groups: t.groups.map((g) =>
                  g.id === groupId ? { ...g, slots } : g,
                ),
              }
            : t,
        ),
      );
    },
    [setTemplates],
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
    setTemplates,
  };
}
