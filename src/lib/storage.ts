import type { AAR, ORBAT, Person, Rank, Template } from '../types';
import {
  sanitizeAAR,
  sanitizeCollection,
  sanitizeOrbat,
  sanitizePerson,
  sanitizeRank,
  sanitizeTemplate,
} from './schema';

/**
 * The persistence seam.
 *
 * Everything that used to be spread across seven files — storage keys, JSON
 * parsing, the validation duty nobody exercised, and the schema migration —
 * lives behind this module. Callers name a collection; they never name a key,
 * never see a string, and never receive a record that failed validation.
 *
 * The backing store is an adapter, so the same code runs against localStorage
 * in the browser and against memory in tests.
 */

// ---- Adapters ----------------------------------------------------------------

export interface StorageAdapter {
  read(key: string): string | null;
  /** Throws when the store refuses the write (quota, private mode). */
  write(key: string, value: string): void;
  /** Fires when *another* tab writes a key. Returns an unsubscribe. */
  subscribe(listener: (key: string) => void): () => void;
}

export function localStorageAdapter(): StorageAdapter {
  return {
    read(key) {
      try {
        return localStorage.getItem(key);
      } catch {
        // Storage disabled entirely (some private modes) — read as empty.
        return null;
      }
    },
    write(key, value) {
      localStorage.setItem(key, value);
    },
    subscribe(listener) {
      // The storage event fires only in the tabs that did not write, which is
      // exactly the set of tabs that need to catch up.
      const handler = (event: StorageEvent) => {
        if (event.key) listener(event.key);
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  };
}

export function memoryAdapter(
  seed: Record<string, string> = {},
): StorageAdapter & { entries: Map<string, string>; emit(key: string): void } {
  const entries = new Map(Object.entries(seed));
  const listeners = new Set<(key: string) => void>();
  return {
    entries,
    read: (key) => entries.get(key) ?? null,
    write(key, value) {
      entries.set(key, value);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** Stand in for another tab having written this key. */
    emit(key) {
      for (const listener of listeners) listener(key);
    },
  };
}

let adapter: StorageAdapter = localStorageAdapter();

/** Swap the backing store. Returns the adapter that was in place. */
export function setStorageAdapter(next: StorageAdapter): StorageAdapter {
  const previous = adapter;
  adapter = next;
  migrated = new WeakSet();
  return previous;
}

export function storageAdapter(): StorageAdapter {
  return adapter;
}

// ---- Collections -------------------------------------------------------------

interface CollectionTypes {
  people: Person;
  ranks: Rank;
  templates: Template;
  orbats: ORBAT;
  aars: AAR;
}

export type CollectionName = keyof CollectionTypes;
export type CollectionRecord<N extends CollectionName> = CollectionTypes[N];

interface CollectionSchema<T> {
  key: string;
  label: string;
  sanitize: (value: unknown) => T | null;
}

const COLLECTIONS: {
  [N in CollectionName]: CollectionSchema<CollectionTypes[N]>;
} = {
  people: {
    key: 'orbat-maker:people',
    label: 'personnel',
    sanitize: sanitizePerson,
  },
  ranks: { key: 'orbat-maker:ranks', label: 'ranks', sanitize: sanitizeRank },
  templates: {
    key: 'orbat-maker:templates',
    label: 'templates',
    sanitize: sanitizeTemplate,
  },
  orbats: {
    key: 'orbat-maker:orbats',
    label: 'ORBATs',
    sanitize: sanitizeOrbat,
  },
  aars: { key: 'orbat-maker:aars', label: 'AARs', sanitize: sanitizeAAR },
};

export function collectionKey(name: CollectionName): string {
  return COLLECTIONS[name].key;
}

/** Where an unreadable payload is parked instead of being overwritten. */
function quarantineKey(name: CollectionName): string {
  return `orbat-maker:unreadable:${name}`;
}

// ---- Migration ---------------------------------------------------------------

const META_KEY = 'orbat-maker:meta';
const CURRENT_VERSION = 1;

let migrated = new WeakSet<StorageAdapter>();

/**
 * Bring stored data up to the current schema version. Runs before the first
 * read of any collection, not in an effect after the stores have already read.
 */
export function migrate(target: StorageAdapter = adapter): void {
  const raw = target.read(META_KEY);
  let version = 0;
  if (raw !== null) {
    try {
      const meta: unknown = JSON.parse(raw);
      if (
        typeof meta === 'object' &&
        meta !== null &&
        typeof (meta as { version?: unknown }).version === 'number'
      ) {
        version = (meta as { version: number }).version;
      }
    } catch {
      // Unreadable meta: treat the data as unversioned and re-stamp it.
      version = 0;
    }
  }

  // Future migrations run here, in order, each guarded by `version < n`.

  if (version !== CURRENT_VERSION) {
    try {
      target.write(META_KEY, JSON.stringify({ version: CURRENT_VERSION }));
    } catch {
      // A store that will not take the stamp will not take the data either;
      // the write path reports that where the user can see it.
    }
  }
  migrated.add(target);
}

function ensureMigrated(target: StorageAdapter): void {
  if (!migrated.has(target)) migrate(target);
}

// ---- Notices -----------------------------------------------------------------

const notices = new Set<string>();
const noticeListeners = new Set<() => void>();
// Subscribers compare snapshots by identity, so the array is rebuilt only when
// the set behind it actually changes.
let noticeSnapshot: string[] = [];

function publishNotices(): void {
  noticeSnapshot = [...notices];
  for (const listener of noticeListeners) listener();
}

/** Record something the user needs to know about their stored data. */
export function noteStorageProblem(message: string): void {
  if (notices.has(message)) return;
  notices.add(message);
  publishNotices();
}

/** Drop a notice once the user has acknowledged it. */
export function dismissStorageNotice(message: string): void {
  if (!notices.delete(message)) return;
  publishNotices();
}

/**
 * Watch the pending notices.
 *
 * The banner subscribes rather than reading once, because the stores that
 * raise notices sit above it and React runs a child's effects before its
 * parent's: a one-shot read on mount always ran before there was anything to
 * find, and a write refused later in the session never showed at all.
 */
export function subscribeToStorageNotices(listener: () => void): () => void {
  noticeListeners.add(listener);
  return () => {
    noticeListeners.delete(listener);
  };
}

/** The pending notices. Stable between changes, so it is safe to render from. */
export function storageNotices(): string[] {
  return noticeSnapshot;
}

/** Read and clear the pending notices. */
export function drainStorageNotices(): string[] {
  const drained = noticeSnapshot;
  if (notices.size === 0) return drained;
  notices.clear();
  publishNotices();
  return drained;
}

// ---- Reading -----------------------------------------------------------------

export interface CollectionRead<T> {
  records: T[];
  /** What went wrong, phrased for the user. */
  notice?: string;
  /** True when the cleaned-up records should be written back. */
  repaired: boolean;
}

/**
 * Read a collection, keeping whatever survives validation. An unreadable
 * payload is parked under a quarantine key rather than silently replaced with
 * an empty array, so nothing is destroyed without the user being told.
 */
export function readCollection<N extends CollectionName>(
  name: N,
  target: StorageAdapter = adapter,
): CollectionRead<CollectionRecord<N>> {
  ensureMigrated(target);
  const { key, label, sanitize } = COLLECTIONS[name];
  const raw = target.read(key);
  if (raw === null) return { records: [], repaired: false };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return quarantine(
      name,
      raw,
      target,
      `Your saved ${label} could not be read`,
    );
  }
  if (!Array.isArray(parsed)) {
    return quarantine(name, raw, target, `Your saved ${label} were malformed`);
  }

  const { valid, rejected } = sanitizeCollection(parsed, sanitize);
  if (rejected === 0) return { records: valid, repaired: false };

  return {
    records: valid,
    repaired: true,
    notice: `Dropped ${rejected} damaged ${label} ${
      rejected === 1 ? 'record' : 'records'
    } while loading. The rest of your data is intact.`,
  };
}

function quarantine<N extends CollectionName>(
  name: N,
  raw: string,
  target: StorageAdapter,
  problem: string,
): CollectionRead<CollectionRecord<N>> {
  let kept = false;
  try {
    target.write(quarantineKey(name), raw);
    kept = true;
  } catch {
    // Nothing more to be done; the notice below still tells the user.
  }
  return {
    records: [],
    // Once the bytes are safely parked, the empty collection is written back
    // so the same unreadable payload is not re-read and re-reported on every
    // later load. Without a backup there is nothing to fall back on, so the
    // original is left exactly where it is.
    repaired: kept,
    notice: kept
      ? `${problem}. A copy of the unreadable data was kept under "${quarantineKey(name)}" in browser storage.`
      : `${problem}, and could not be recovered.`,
  };
}

// ---- Writing -----------------------------------------------------------------

/**
 * Persist a collection. Returns a notice when the store refused the write —
 * a quota error must not escape into a React dispatch, where nothing catches
 * it.
 */
export function writeCollection<N extends CollectionName>(
  name: N,
  records: CollectionRecord<N>[],
  target: StorageAdapter = adapter,
): string | null {
  const { key, label } = COLLECTIONS[name];
  try {
    target.write(key, JSON.stringify(records));
    return null;
  } catch {
    return `Could not save your ${label} — browser storage is full or unavailable. Recent changes may be lost when you reload.`;
  }
}
