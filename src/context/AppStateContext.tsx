import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { usePeople } from '../hooks/usePeople'
import { useTemplates } from '../hooks/useTemplates'
import { useOrbats } from '../hooks/useOrbats'
import { initStorage } from '../lib/storage'

type AppState = ReturnType<typeof usePeople> &
  ReturnType<typeof useTemplates> &
  ReturnType<typeof useOrbats>

const AppStateContext = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  useEffect(() => { initStorage() }, [])
  const people = usePeople()
  const templates = useTemplates()
  const orbats = useOrbats()

  return (
    <AppStateContext.Provider value={{ ...people, ...templates, ...orbats }}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
