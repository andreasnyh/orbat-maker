import { beforeEach, describe, expect, it } from 'vitest';
import { defaultTemplates } from '../data/defaultTemplates';
import type { Person } from '../types';
import {
  collectionKey,
  dismissStorageNotice,
  drainStorageNotices,
  memoryAdapter,
  migrate,
  noteStorageProblem,
  readCollection,
  type StorageAdapter,
  storageNotices,
  subscribeToStorageNotices,
  writeCollection,
} from './storage';

const nyx: Person = { id: 'p1', name: 'Nyx', rank: 'SGT' };
const vex: Person = { id: 'p2', name: 'Vex' };

const PEOPLE_KEY = collectionKey('people');
const META_KEY = 'orbat-maker:meta';

beforeEach(() => {
  drainStorageNotices();
});

function withPeople(...records: unknown[]) {
  return memoryAdapter({ [PEOPLE_KEY]: JSON.stringify(records) });
}

describe('reading a collection', () => {
  it('reads back what was written', () => {
    const adapter = memoryAdapter();
    expect(writeCollection('people', [nyx, vex], adapter)).toBeNull();
    expect(readCollection('people', adapter)).toEqual({
      records: [nyx, vex],
      repaired: false,
    });
  });

  it('gives the seeded default templates back unchanged', () => {
    // Every reload now runs the shipped defaults through the sanitizer. If it
    // altered or dropped any of them, the seed effect would rewrite the
    // templates key on every load — or worse, lose a group or a slot.
    const adapter = memoryAdapter();
    writeCollection('templates', defaultTemplates, adapter);
    expect(readCollection('templates', adapter)).toEqual({
      records: defaultTemplates,
      repaired: false,
    });
  });

  it('treats a missing key as an empty collection', () => {
    expect(readCollection('people', memoryAdapter())).toEqual({
      records: [],
      repaired: false,
    });
  });

  it('keeps the valid records and reports the damaged ones', () => {
    const adapter = withPeople(nyx, { id: 'p2' }, 'garbage');
    const result = readCollection('people', adapter);
    expect(result.records).toEqual([nyx]);
    expect(result.repaired).toBe(true);
    expect(result.notice).toContain('Dropped 2 damaged personnel records');
  });

  it('writes the repaired collection back so the damage does not recur', () => {
    // The hook writes on a repaired read; this is the value it persists.
    const adapter = withPeople(nyx, { id: 'p2' });
    const { records } = readCollection('people', adapter);
    writeCollection('people', records, adapter);
    expect(readCollection('people', adapter)).toEqual({
      records: [nyx],
      repaired: false,
    });
  });

  it('quarantines an unreadable payload instead of dropping it', () => {
    const adapter = memoryAdapter({ [PEOPLE_KEY]: '{"people": [' });
    const result = readCollection('people', adapter);

    expect(result.records).toEqual([]);
    // The old behaviour: silently reset to [] and the bytes are gone.
    expect(adapter.entries.get('orbat-maker:unreadable:people')).toBe(
      '{"people": [',
    );
    expect(result.notice).toContain('could not be read');
  });

  it('quarantines a payload that is not a collection at all', () => {
    const adapter = memoryAdapter({ [PEOPLE_KEY]: '{"p1":"Nyx"}' });
    const result = readCollection('people', adapter);
    expect(result.records).toEqual([]);
    expect(adapter.entries.get('orbat-maker:unreadable:people')).toBe(
      '{"p1":"Nyx"}',
    );
    expect(result.notice).toContain('malformed');
  });

  it('says so when even the quarantine copy cannot be kept', () => {
    const adapter: StorageAdapter = {
      ...memoryAdapter({ [PEOPLE_KEY]: 'not json' }),
      write() {
        throw new Error('QuotaExceededError');
      },
    };
    expect(readCollection('people', adapter).notice).toContain(
      'could not be recovered',
    );
  });

  it('writes back over a quarantined payload so it is not re-read forever', () => {
    const adapter = memoryAdapter({ [PEOPLE_KEY]: '{"people": [' });
    const first = readCollection('people', adapter);
    expect(first.repaired).toBe(true);

    // The hook writes on a repaired read; this is the value it persists.
    writeCollection('people', first.records, adapter);

    // Second load is clean: no re-parse, no second copy, no repeated banner.
    expect(readCollection('people', adapter)).toEqual({
      records: [],
      repaired: false,
    });
    expect(adapter.entries.get('orbat-maker:unreadable:people')).toBe(
      '{"people": [',
    );
  });

  it('leaves the original alone when the quarantine copy could not be kept', () => {
    // Nothing was parked, so overwriting the key would destroy the only copy
    // of data the user might still recover by hand.
    const adapter: StorageAdapter = {
      ...memoryAdapter({ [PEOPLE_KEY]: 'not json' }),
      write() {
        throw new Error('QuotaExceededError');
      },
    };
    expect(readCollection('people', adapter).repaired).toBe(false);
  });
});

describe('writing a collection', () => {
  it('reports a refused write instead of throwing into the caller', () => {
    // Previously this threw inside a React state updater, mid-dispatch, with
    // no ErrorBoundary anywhere in src.
    const adapter: StorageAdapter = {
      ...memoryAdapter(),
      write() {
        throw new Error('QuotaExceededError');
      },
    };
    const notice = writeCollection('people', [nyx], adapter);
    expect(notice).toContain('browser storage is full');
  });
});

describe('migration', () => {
  it('stamps the current version before the first read', () => {
    const adapter = memoryAdapter();
    readCollection('people', adapter);
    expect(adapter.entries.get(META_KEY)).toBe('{"version":1}');
  });

  it('leaves an already-current stamp alone', () => {
    const adapter = memoryAdapter({ [META_KEY]: '{"version":1}' });
    migrate(adapter);
    expect(adapter.entries.get(META_KEY)).toBe('{"version":1}');
  });

  it('survives an unreadable version stamp', () => {
    // JSON.parse on this used to run uncaught, in an effect, after every
    // store had already read.
    const adapter = memoryAdapter({ [META_KEY]: 'not json' });
    expect(() => migrate(adapter)).not.toThrow();
    expect(adapter.entries.get(META_KEY)).toBe('{"version":1}');
  });

  it('does not fail when the store refuses the stamp', () => {
    const adapter: StorageAdapter = {
      ...memoryAdapter(),
      write() {
        throw new Error('QuotaExceededError');
      },
    };
    expect(() => migrate(adapter)).not.toThrow();
  });
});

describe('notices', () => {
  it('reports each distinct problem once, however often it is noted', () => {
    // StrictMode runs the read and the effect that notes it twice.
    const adapter = withPeople({ id: 'p2' });
    const notice = readCollection('people', adapter).notice;
    expect(notice).toBeDefined();
    if (!notice) return;

    noteStorageProblem(notice);
    noteStorageProblem(notice);
    noteStorageProblem('something else');

    expect(drainStorageNotices()).toEqual([notice, 'something else']);
    // Draining clears them, so a later render does not repeat the banner.
    expect(drainStorageNotices()).toEqual([]);
  });

  it('reaches a banner that subscribed before anything was noted', () => {
    // The banner renders below the stores that raise notices, and React runs
    // a child's effects before its parent's, so it always starts watching an
    // empty queue. Reading once there found nothing, every time.
    const seen: string[][] = [];
    const unsubscribe = subscribeToStorageNotices(() =>
      seen.push(storageNotices()),
    );
    expect(storageNotices()).toEqual([]);

    noteStorageProblem('the stores read after the banner mounted');
    // A write refused much later in the session lands the same way.
    noteStorageProblem('browser storage is full');

    expect(seen).toEqual([
      ['the stores read after the banner mounted'],
      ['the stores read after the banner mounted', 'browser storage is full'],
    ]);

    unsubscribe();
    noteStorageProblem('after unsubscribe');
    expect(seen).toHaveLength(2);
  });

  it('holds the snapshot steady so a repeat note does not re-render', () => {
    noteStorageProblem('steady');
    const first = storageNotices();
    noteStorageProblem('steady');
    expect(storageNotices()).toBe(first);
  });

  it('drops a notice the user dismissed and keeps the rest', () => {
    noteStorageProblem('dismissed');
    noteStorageProblem('kept');
    dismissStorageNotice('dismissed');
    expect(storageNotices()).toEqual(['kept']);
  });
});

describe('cross-tab reconciliation', () => {
  it('sees what another tab wrote to the same key', () => {
    const adapter = memoryAdapter();
    const seen: string[] = [];
    const unsubscribe = adapter.subscribe((key) => seen.push(key));

    writeCollection('people', [nyx], adapter);
    adapter.emit(PEOPLE_KEY);
    expect(seen).toEqual([PEOPLE_KEY]);
    expect(readCollection('people', adapter).records).toEqual([nyx]);

    unsubscribe();
    adapter.emit(PEOPLE_KEY);
    expect(seen).toEqual([PEOPLE_KEY]);
  });
});
