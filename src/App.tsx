import { lazy, Suspense } from 'react';
import { AppShell } from './components/layout/AppShell';
import { AppStateProvider } from './context/AppStateContext';
import { useHashRouter } from './hooks/useHashRouter';
import { useTheme } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';

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
const AARListPage = lazy(() =>
  import('./components/aar/AARListPage').then((m) => ({
    default: m.AARListPage,
  })),
);
const AAREditorPage = lazy(() =>
  import('./components/aar/AAREditorPage').then((m) => ({
    default: m.AAREditorPage,
  })),
);
const AboutPage = lazy(() =>
  import('./components/about/AboutPage').then((m) => ({
    default: m.AboutPage,
  })),
);

function PageSkeleton() {
  return (
    <div className="animate-pulse motion-reduce:animate-none space-y-4 py-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 rounded bg-trim/40" />
        <div className="h-8 w-24 rounded bg-trim/40" />
      </div>
      {/* Content cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-lg border border-trim bg-panel"
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  const { theme, setTheme } = useTheme();
  const { currentPage, activeId, navigate } = useHashRouter();

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
      case 'aar-list':
        if (!activeId) return null;
        return <AARListPage orbatId={activeId} onNavigate={navigate} />;
      case 'aar-editor':
        if (!activeId) return null;
        return <AAREditorPage aarId={activeId} onNavigate={navigate} />;
      case 'about':
        return <AboutPage />;
    }
  };

  return (
    <AppStateProvider>
      <ToastProvider>
        <AppShell
          currentPage={currentPage}
          onNavigate={navigate}
          theme={theme}
          setTheme={setTheme}
        >
          <Suspense fallback={<PageSkeleton />}>{renderPage()}</Suspense>
        </AppShell>
      </ToastProvider>
    </AppStateProvider>
  );
}

export default App;
