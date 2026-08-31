import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type CollectionName,
  type CollectionRecord,
  collectionKey,
  noteStorageProblem,
  readCollection,
  storageAdapter,
  writeCollection,
} from '../lib/storage';

/**
 * State backed by a stored collection.
 *
 * The hook knows a collection's *name*, never its key or its wire format —
 * validation, migration and recovery all happen behind the storage seam.
 * Writes are scheduled from an effect rather than run inside the state
 * updater, so the updater stays pure and a refused write cannot throw its way
 * into a React dispatch.
 */
export function useStoredCollection<N extends CollectionName>(
  name: N,
): [
  CollectionRecord<N>[],
  (
    value:
      | CollectionRecord<N>[]
      | ((prev: CollectionRecord<N>[]) => CollectionRecord<N>[]),
  ) => void,
] {
  const [initial] = useState(() => readCollection(name));
  const [records, setRecords] = useState(initial.records);
  // A repaired read is already out of step with what is stored, so it starts
  // dirty and the cleaned-up records get written back.
  const dirty = useRef(initial.repaired);

  useEffect(() => {
    if (initial.notice) noteStorageProblem(initial.notice);
  }, [initial]);

  useEffect(() => {
    if (!dirty.current) return;
    dirty.current = false;
    const notice = writeCollection(name, records);
    if (notice) noteStorageProblem(notice);
  }, [name, records]);

  // Another tab wrote this collection: adopt what it stored instead of
  // clobbering it with state read before that write happened.
  useEffect(() => {
    const key = collectionKey(name);
    return storageAdapter().subscribe((changed) => {
      if (changed !== key) return;
      const result = readCollection(name);
      if (result.notice) noteStorageProblem(result.notice);
      dirty.current = false;
      setRecords(result.records);
    });
  }, [name]);

  const setValue = useCallback(
    (
      value:
        | CollectionRecord<N>[]
        | ((prev: CollectionRecord<N>[]) => CollectionRecord<N>[]),
    ) => {
      dirty.current = true;
      setRecords((prev) => (value instanceof Function ? value(prev) : value));
    },
    [],
  );

  return [records, setValue];
}
