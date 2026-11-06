import { useCallback, useMemo } from 'react';
import { mergeById } from '../lib/collections';
import { generateId } from '../lib/ids';
import type { Rank } from '../types';
import { useStoredCollection } from './useStoredCollection';

export function isSameRankName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** The existing rank's spelling when `name` matches one, else `name`. */
export function canonicalRankName(ranks: Rank[], name: string): string {
  return ranks.find((r) => isSameRankName(r.name, name))?.name ?? name;
}

export function useRanks() {
  const [ranks, setRanks] = useStoredCollection('ranks');

  const addRank = useCallback(
    (name: string) => {
      const rank: Rank = { id: generateId(), name };
      setRanks((prev) =>
        prev.some((r) => isSameRankName(r.name, name)) ? prev : [...prev, rank],
      );
    },
    [setRanks],
  );

  const updateRank = useCallback(
    (id: string, updates: Partial<Omit<Rank, 'id'>>) => {
      setRanks((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      );
    },
    [setRanks],
  );

  const deleteRank = useCallback(
    (id: string) => {
      setRanks((prev) => prev.filter((r) => r.id !== id));
    },
    [setRanks],
  );

  /** Append records that are new by id — the import applier's way in. */
  const addRanks = useCallback(
    (incoming: Rank[]) => {
      setRanks((prev) => mergeById(prev, incoming));
    },
    [setRanks],
  );

  // Memoized so this hook's context only re-renders its own consumers.
  // Without it every setX produced a fresh object and the six-context
  // split behaved like one big context.
  return useMemo(
    () => ({
      ranks,
      addRank,
      updateRank,
      deleteRank,
      addRanks,
      setRanks,
    }),
    [ranks, addRank, updateRank, deleteRank, addRanks, setRanks],
  );
}
