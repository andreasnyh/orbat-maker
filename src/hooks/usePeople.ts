import { useCallback, useMemo } from 'react';
import { mergeById } from '../lib/collections';
import { generateId } from '../lib/ids';
import type { Person } from '../types';
import { useStoredCollection } from './useStoredCollection';

export function usePeople() {
  const [people, setPeople] = useStoredCollection('people');

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

  // Memoized so this hook's context only re-renders its own consumers.
  // Without it every setX produced a fresh object and the six-context
  // split behaved like one big context.
  return useMemo(
    () => ({
      people,
      addPerson,
      updatePerson,
      deletePerson,
      addPeople,
      setPeople,
    }),
    [people, addPerson, updatePerson, deletePerson, addPeople, setPeople],
  );
}
