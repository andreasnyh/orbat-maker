import { useCallback } from 'react';
import { mergeById } from '../lib/collections';
import { generateId } from '../lib/ids';
import type { AAR } from '../types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'orbat-maker:aars';

export function useAARs() {
  const [aars, setAARs] = useLocalStorage<AAR[]>(STORAGE_KEY, []);

  const createAAR = useCallback(
    (orbatId: string, title: string, content: string) => {
      const now = new Date().toISOString();
      const aar: AAR = {
        id: generateId(),
        orbatId,
        title,
        content,
        createdAt: now,
        updatedAt: now,
      };
      setAARs((prev) => [...prev, aar]);
      return aar;
    },
    [setAARs],
  );

  const updateAAR = useCallback(
    (
      id: string,
      updates: Partial<Omit<AAR, 'id' | 'orbatId' | 'createdAt'>>,
    ) => {
      setAARs((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, ...updates, updatedAt: new Date().toISOString() }
            : a,
        ),
      );
    },
    [setAARs],
  );

  const deleteAAR = useCallback(
    (id: string) => {
      setAARs((prev) => prev.filter((a) => a.id !== id));
    },
    [setAARs],
  );

  /** Append records that are new by id — the import applier's way in. */
  const addAARs = useCallback(
    (incoming: AAR[]) => {
      setAARs((prev) => mergeById(prev, incoming));
    },
    [setAARs],
  );

  return { aars, createAAR, updateAAR, deleteAAR, addAARs, setAARs };
}
