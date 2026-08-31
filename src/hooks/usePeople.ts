import { useCallback } from 'react';
import { mergeById } from '../lib/collections';
import { generateId } from '../lib/ids';
import type { Person } from '../types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'orbat-maker:people';

export function usePeople() {
  const [people, setPeople] = useLocalStorage<Person[]>(STORAGE_KEY, []);

  const addPerson = useCallback(
    (name: string, rank?: string) => {
      const person: Person = { id: generateId(), name, rank };
      setPeople((prev) => [...prev, person]);
      return person;
    },
    [setPeople],
  );

  const updatePerson = useCallback(
    (id: string, updates: Partial<Omit<Person, 'id'>>) => {
      setPeople((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
    },
    [setPeople],
  );

  const deletePerson = useCallback(
    (id: string) => {
      setPeople((prev) => prev.filter((p) => p.id !== id));
    },
    [setPeople],
  );

  /** Append records that are new by id — the import applier's way in. */
  const addPeople = useCallback(
    (incoming: Person[]) => {
      setPeople((prev) => mergeById(prev, incoming));
    },
    [setPeople],
  );

  return {
    people,
    addPerson,
    updatePerson,
    deletePerson,
    addPeople,
    setPeople,
  };
}
