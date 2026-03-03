import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import { useOrbats } from '../hooks/useOrbats';
import { usePeople } from '../hooks/usePeople';
import { useTemplates } from '../hooks/useTemplates';
import { initStorage } from '../lib/storage';

type AppState = ReturnType<typeof usePeople> &
  ReturnType<typeof useTemplates> &
  ReturnType<typeof useOrbats> & {
    ensureOwnTemplate: (orbatId: string) => string | null;
  };

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initStorage();
  }, []);
  const people = usePeople();
  const templates = useTemplates();
  const orbats = useOrbats();

  const ensureOwnTemplate = useCallback(
    (orbatId: string): string | null => {
      const orbat = orbats.orbats.find((o) => o.id === orbatId);
      if (!orbat) return null;

      const template = templates.templates.find(
        (t) => t.id === orbat.templateId,
      );
      if (!template) return null;

      // Fork if shared by other ORBATs or if it's a default template
      const isShared = orbats.orbats.some(
        (o) => o.id !== orbatId && o.templateId === orbat.templateId,
      );
      if (!isShared && !template.isDefault) return orbat.templateId;

      // Fork: preserve group/slot IDs so existing assignments stay valid
      const forked = templates.forkTemplate(
        template.id,
        `${template.name} (${orbat.name})`,
      );
      if (!forked) return null;

      orbats.updateOrbat(orbatId, { templateId: forked.id });
      return forked.id;
    },
    [orbats, templates],
  );

  return (
    <AppStateContext.Provider
      value={{ ...people, ...templates, ...orbats, ensureOwnTemplate }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
