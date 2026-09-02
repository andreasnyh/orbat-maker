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
 * updater, so a refused write cannot throw its way into a React dispatch. The
 * updater's one side effect is raising the dirty flag, which only it is in a
 * position to judge: whether an update changed anything is not knowable until
 * the updater has run against the current records.
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
      // An edit made here is already on its way to storage but has not been
      // written yet. Adopting the other tab's copy now would drop it for good,
      // so let the pending write land: it raises a storage event of its own
      // and the other tab converges on it instead.
      if (dirty.current) return;
      const result = readCollection(name);
      if (result.notice) noteStorageProblem(result.notice);
      setRecords(result.records);
    });
  }, [name]);

  const setValue = useCallback(
    (
      value:
        | CollectionRecord<N>[]
        | ((prev: CollectionRecord<N>[]) => CollectionRecord<N>[]),
    ) => {
      setRecords((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        // Only mark dirty when something actually changed. React bails out of
        // the re-render when the reference is unchanged, so the write effect
        // never runs to clear the flag — and a permanently dirty collection
        // ignores every cross-tab update for the rest of the session. Raising
        // the flag is idempotent, so a double-invoked updater is harmless.
        if (next !== prev) dirty.current = true;
        return next;
      });
    },
    [],
  );

  return [records, setValue];
}
