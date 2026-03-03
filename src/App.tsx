import { useState, useCallback } from 'react'
import { AppShell } from './components/layout/AppShell'
import { AppStateProvider } from './context/AppStateContext'
import { PeopleRosterPage } from './components/people/PeopleRosterPage'
import { TemplateListPage } from './components/templates/TemplateListPage'
import { TemplateEditorPage } from './components/templates/TemplateEditorPage'
import { OrbatListPage } from './components/orbat/OrbatListPage'
import { OrbatBuilderPage } from './components/orbat/OrbatBuilderPage'
import type { Page } from './types'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('orbats')
  const [activeId, setActiveId] = useState<string | null>(null)

  const navigate = useCallback((page: Page, id?: string) => {
    setCurrentPage(page)
    setActiveId(id ?? null)
  }, [])

  const renderPage = () => {
    switch (currentPage) {
      case 'people':
        return <PeopleRosterPage />
      case 'templates':
        return <TemplateListPage onNavigate={navigate} />
      case 'template-editor':
        if (!activeId) return null
        return <TemplateEditorPage templateId={activeId} onNavigate={navigate} />
      case 'orbats':
        return <OrbatListPage onNavigate={navigate} />
      case 'orbat-builder':
        if (!activeId) return null
        return <OrbatBuilderPage orbatId={activeId} onNavigate={navigate} />
    }
  }

  return (
    <AppStateProvider>
      <AppShell currentPage={currentPage} onNavigate={navigate}>
        {renderPage()}
      </AppShell>
    </AppStateProvider>
  )
}

export default App
