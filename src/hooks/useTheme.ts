import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'midnight' | 'olive' | 'sand';

const STORAGE_KEY = 'orbat-theme';
const VALID_THEMES: Theme[] = ['midnight', 'olive', 'sand'];
const DEFAULT_THEME: Theme = 'midnight';

function getStoredTheme(): Theme {
  const raw = localStorage.getItem(STORAGE_KEY);
  return VALID_THEMES.includes(raw as Theme) ? (raw as Theme) : DEFAULT_THEME;
}

// Notify subscribers when theme changes
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme =
    theme === 'sand' ? 'light' : 'dark';

  const meta = document.querySelector('meta[name="theme-color"]');
  const panelColor =
    theme === 'midnight'
      ? '#1a1a2e'
      : theme === 'olive'
        ? '#1e211a'
        : '#ffffff';
  if (meta) meta.setAttribute('content', panelColor);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getStoredTheme);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    for (const cb of listeners) cb();
  }, []);

  return { theme, setTheme } as const;
}
