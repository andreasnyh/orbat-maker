import { useEffect, useState } from 'react';
import { drainStorageNotices } from '../../lib/storage';
import { AlertBanner } from './AlertBanner';

/**
 * Surfaces anything the storage seam had to do to keep the app loadable —
 * records dropped, a payload quarantined, a write refused. A banner rather
 * than a toast: losing stored data is not a two-second message.
 */
export function StorageNotices() {
  const [notices, setNotices] = useState<string[]>([]);

  useEffect(() => {
    const pending = drainStorageNotices();
    if (pending.length > 0) setNotices((prev) => [...prev, ...pending]);
  }, []);

  if (notices.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-4">
      {notices.map((notice) => (
        <AlertBanner key={notice} variant="danger">
          <span className="flex items-start justify-between gap-3">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() =>
                setNotices((prev) => prev.filter((n) => n !== notice))
              }
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
