import { useCallback } from 'react';
import { generateId } from '../lib/ids';
import type { Rank } from '../types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'orbat-maker:ranks';

export function useRanks() {
  const [ranks, setRanks] = useLocalStorage<Rank[]>(STORAGE_KEY, []);

  const addRank = useCallback(
    (name: string) => {
      const rank: Rank = { id: generateId(), name };
      setRanks((prev) => [...prev, rank]);
      return rank;
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

  return { ranks, addRank, updateRank, deleteRank, setRanks };
}
