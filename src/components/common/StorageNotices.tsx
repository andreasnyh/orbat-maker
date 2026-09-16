import { useSyncExternalStore } from 'react';
import {
  dismissStorageNotice,
  storageNotices,
  subscribeToStorageNotices,
} from '../../lib/storage';
import { AlertBanner } from './AlertBanner';

/**
 * Surfaces anything the storage seam had to do to keep the app loadable —
 * records dropped, a payload quarantined, a write refused. A banner rather
 * than a toast: losing stored data is not a two-second message.
 *
 * It subscribes to the seam instead of reading it once on mount. The stores
 * that raise notices are rendered above this component, and React runs a
 * child's effects before its parent's, so a one-shot read always ran before
 * there was anything to find — and a write refused later in the session would
 * never have appeared at all.
 */
export function StorageNotices() {
  const notices = useSyncExternalStore(
    subscribeToStorageNotices,
    storageNotices,
  );

  if (notices.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-4">
      {notices.map((notice) => (
        <AlertBanner key={notice} variant="danger">
          <span className="flex items-start justify-between gap-3">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => dismissStorageNotice(notice)}
              className="shrink-0 text-xs font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/60 rounded"
            >
              Dismiss
            </button>
          </span>
        </AlertBanner>
      ))}
    </div>
  );
}
