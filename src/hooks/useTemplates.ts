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

  // Seed defaults on first load
  useEffect(() => {
    setTemplates((prev) => (prev.length === 0 ? defaultTemplates : prev));
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
    (id: string) => {
      const original = templates.find((t) => t.id === id);
      if (!original) return null;
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
      setTemplates((prev) => [...prev, duplicate]);
      return duplicate;
    },
    [templates, setTemplates],
  );

  /** Fork a template preserving all group/slot IDs (so assignments remain valid). */
  const forkTemplate = useCallback(
    (id: string, newName: string) => {
      const original = templates.find((t) => t.id === id);
      if (!original) return null;
      const forked: Template = {
        ...structuredClone(original),
        id: generateId(),
        name: newName,
        isDefault: false,
      };
      setTemplates((prev) => [...prev, forked]);
      return forked;
    },
    [templates, setTemplates],
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
    setTemplates,
  };
}
