import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { useOrbats } from '../hooks/useOrbats';
import { usePeople } from '../hooks/usePeople';
import { useRanks } from '../hooks/useRanks';
import { useTemplates } from '../hooks/useTemplates';
import { initStorage } from '../lib/storage';

// ---- Individual context types ------------------------------------------------

type PeopleState = ReturnType<typeof usePeople>;
type RanksState = ReturnType<typeof useRanks>;
type TemplatesState = ReturnType<typeof useTemplates>;
type OrbatsState = ReturnType<typeof useOrbats>;
interface CrossCuttingState {
  ensureOwnTemplate: (orbatId: string) => string | null;
}

// ---- Contexts ----------------------------------------------------------------

const PeopleContext = createContext<PeopleState | null>(null);
const RanksContext = createContext<RanksState | null>(null);
const TemplatesContext = createContext<TemplatesState | null>(null);
const OrbatsContext = createContext<OrbatsState | null>(null);
const CrossCuttingContext = createContext<CrossCuttingState | null>(null);

// ---- Provider ----------------------------------------------------------------

export function AppStateProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initStorage();
  }, []);

  const people = usePeople();
  const ranks = useRanks();
  const templates = useTemplates();
  const orbats = useOrbats();

  const { orbats: orbatList, updateOrbat } = orbats;
  const { templates: templateList, forkTemplate } = templates;

  const ensureOwnTemplate = useCallback(
    (orbatId: string): string | null => {
      const orbat = orbatList.find((o) => o.id === orbatId);
      if (!orbat) return null;

      const template = templateList.find((t) => t.id === orbat.templateId);
      if (!template) return null;

      // Fork if shared by other ORBATs or if it's a default template
      const isShared = orbatList.some(
        (o) => o.id !== orbatId && o.templateId === orbat.templateId,
      );
      if (!isShared && !template.isDefault) return orbat.templateId;

      // Fork: preserve group/slot IDs so existing assignments stay valid
      const forked = forkTemplate(
        template.id,
        `${template.name} (${orbat.name})`,
      );
      if (!forked) return null;

      updateOrbat(orbatId, { templateId: forked.id });
      return forked.id;
    },
    [orbatList, templateList, forkTemplate, updateOrbat],
  );

  const crossCuttingValue = useMemo(
    () => ({ ensureOwnTemplate }),
    [ensureOwnTemplate],
  );

  return (
    <PeopleContext.Provider value={people}>
      <RanksContext.Provider value={ranks}>
        <TemplatesContext.Provider value={templates}>
          <OrbatsContext.Provider value={orbats}>
            <CrossCuttingContext.Provider value={crossCuttingValue}>
              {children}
            </CrossCuttingContext.Provider>
          </OrbatsContext.Provider>
        </TemplatesContext.Provider>
      </RanksContext.Provider>
    </PeopleContext.Provider>
  );
}

// ---- Granular hooks ----------------------------------------------------------

export function usePeopleState(): PeopleState {
  const ctx = useContext(PeopleContext);
  if (!ctx)
    throw new Error('usePeopleState must be used within AppStateProvider');
  return ctx;
}

export function useRanksState(): RanksState {
  const ctx = useContext(RanksContext);
  if (!ctx)
    throw new Error('useRanksState must be used within AppStateProvider');
  return ctx;
}

export function useTemplatesState(): TemplatesState {
  const ctx = useContext(TemplatesContext);
  if (!ctx)
    throw new Error('useTemplatesState must be used within AppStateProvider');
  return ctx;
}

export function useOrbatsState(): OrbatsState {
  const ctx = useContext(OrbatsContext);
  if (!ctx)
    throw new Error('useOrbatsState must be used within AppStateProvider');
  return ctx;
}

export function useCrossCuttingState(): CrossCuttingState {
  const ctx = useContext(CrossCuttingContext);
  if (!ctx)
    throw new Error(
      'useCrossCuttingState must be used within AppStateProvider',
    );
  return ctx;
}
