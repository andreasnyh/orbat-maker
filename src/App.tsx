import { lazy, Suspense, useCallback, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { AppStateProvider } from './context/AppStateContext';
import { ToastProvider } from './hooks/useToast';
import type { Page } from './types';

const PeopleRosterPage = lazy(() =>
  import('./components/people/PeopleRosterPage').then((m) => ({
    default: m.PeopleRosterPage,
  })),
);
const TemplateListPage = lazy(() =>
  import('./components/templates/TemplateListPage').then((m) => ({
    default: m.TemplateListPage,
  })),
);
const TemplateEditorPage = lazy(() =>
  import('./components/templates/TemplateEditorPage').then((m) => ({
    default: m.TemplateEditorPage,
  })),
);
const OrbatListPage = lazy(() =>
  import('./components/orbat/OrbatListPage').then((m) => ({
    default: m.OrbatListPage,
  })),
);
const OrbatBuilderPage = lazy(() =>
  import('./components/orbat/OrbatBuilderPage').then((m) => ({
    default: m.OrbatBuilderPage,
  })),
);
const RanksPage = lazy(() =>
  import('./components/ranks/RanksPage').then((m) => ({
    default: m.RanksPage,
  })),
);
const AboutPage = lazy(() =>
  import('./components/about/AboutPage').then((m) => ({
    default: m.AboutPage,
  })),
);

function PageSkeleton() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('orbats');
  const [activeId, setActiveId] = useState<string | null>(null);

  const navigate = useCallback((page: Page, id?: string) => {
    setCurrentPage(page);
    setActiveId(id ?? null);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'people':
        return <PeopleRosterPage />;
      case 'ranks':
        return <RanksPage />;
      case 'templates':
        return <TemplateListPage onNavigate={navigate} />;
      case 'template-editor':
        if (!activeId) return null;
        return (
          <TemplateEditorPage templateId={activeId} onNavigate={navigate} />
        );
      case 'orbats':
        return <OrbatListPage onNavigate={navigate} />;
      case 'orbat-builder':
        if (!activeId) return null;
        return <OrbatBuilderPage orbatId={activeId} onNavigate={navigate} />;
      case 'about':
        return <AboutPage />;
    }
  };

  return (
    <AppStateProvider>
      <ToastProvider>
        <AppShell currentPage={currentPage} onNavigate={navigate}>
          <Suspense fallback={<PageSkeleton />}>{renderPage()}</Suspense>
        </AppShell>
      </ToastProvider>
    </AppStateProvider>
  );
}

export default App;
