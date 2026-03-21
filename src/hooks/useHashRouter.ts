import { useCallback, useSyncExternalStore } from 'react';
import type { Page } from '../types';

const VALID_PAGES: Set<string> = new Set<Page>([
  'people',
  'ranks',
  'templates',
  'template-editor',
  'orbats',
  'orbat-builder',
  'aar-list',
  'aar-editor',
  'about',
] satisfies Page[]);

const DEFAULT_PAGE: Page = 'orbats';

function parseHash(hash: string): { page: Page; id: string | null } {
  const raw = hash.replace(/^#\/?/, '');
  if (!raw) return { page: DEFAULT_PAGE, id: null };

  const [segment, id] = raw.split('/');
  if (!VALID_PAGES.has(segment)) return { page: DEFAULT_PAGE, id: null };

  return { page: segment as Page, id: id ?? null };
}

function toHash(page: Page, id?: string): string {
  return id ? `#/${page}/${id}` : `#/${page}`;
}

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

function getSnapshot() {
  return window.location.hash;
}

export function useHashRouter() {
  const hash = useSyncExternalStore(subscribe, getSnapshot);
  const { page: currentPage, id: activeId } = parseHash(hash);

  const navigate = useCallback((page: Page, id?: string) => {
    window.location.hash = toHash(page, id);
  }, []);

  return { currentPage, activeId, navigate };
}
