import { ArrowLeft, FileText, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  useAARsState,
  useOrbatsState,
  usePeopleState,
  useTemplatesState,
} from '../../context/AppStateContext';
import { generateAARContent, generateAARTitle } from '../../lib/aar';
import type { Page } from '../../types';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface AARListPageProps {
  orbatId: string;
  onNavigate: (page: Page, id?: string) => void;
}

export function AARListPage({ orbatId, onNavigate }: AARListPageProps) {
  const { orbats } = useOrbatsState();
  const { templates } = useTemplatesState();
  const { people } = usePeopleState();
  const { aars, createAAR, deleteAAR } = useAARsState();

  const orbat = useMemo(
    () => orbats.find((o) => o.id === orbatId),
    [orbats, orbatId],
  );
  const template = useMemo(
    () =>
      orbat ? templates.find((t) => t.id === orbat.templateId) : undefined,
    [orbat, templates],
  );

  const orbatAARs = useMemo(
    () =>
      aars
        .filter((a) => a.orbatId === orbatId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    [aars, orbatId],
  );

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleNewAAR = useCallback(() => {
    if (!orbat || !template) return;
    const content = generateAARContent(orbat, template, people);
    const title = generateAARTitle(orbat.name);
    const aar = createAAR(orbatId, title, content);
    onNavigate('aar-editor', aar.id);
  }, [orbat, template, people, orbatId, createAAR, onNavigate]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('orbat-builder', orbatId)}
          aria-label="Back to ORBAT"
          className="shrink-0"
        >
          <ArrowLeft size={14} />
        </Button>
        {orbat && (
          <nav
            className="hidden sm:flex items-center gap-1.5 text-sm shrink-0"
            aria-label="Breadcrumb"
          >
            <span className="text-dim">ORBATs</span>
            <span className="text-chrome">/</span>
            <span className="text-sub truncate max-w-32">{orbat.name}</span>
            <span className="text-chrome">/</span>
          </nav>
        )}

        <h1 className="font-display text-xl font-bold text-strong uppercase tracking-wide truncate">
          AARs
          {orbatAARs.length > 0 && (
            <span className="ml-2 text-sm font-data text-dim font-normal normal-case tracking-normal">
              {orbatAARs.length}
            </span>
          )}
        </h1>

        <div className="ml-auto">
          <Button
            size="sm"
            onClick={handleNewAAR}
            disabled={!orbat || !template}
          >
            <Plus size={14} />
            New AAR
          </Button>
        </div>
      </div>

      {/* List */}
      {orbatAARs.length === 0 ? (
        <div className="text-dim text-center py-12">
          <FileText size={32} className="mx-auto mb-3 opacity-40" />
          <p>No AARs yet.</p>
          <p className="text-xs mt-1">
            Create one to pre-populate it with today's roster.
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {orbatAARs.map((aar) => (
            <div
              key={aar.id}
              className="card relative flex items-center gap-3 px-4 py-3 cursor-pointer"
            >
              <a
                className="absolute inset-0"
                href={`#aar-${aar.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('aar-editor', aar.id);
                }}
              >
                <span className="sr-only">{aar.title}</span>
              </a>
              <FileText size={16} className="text-dim shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-strong truncate">
                  {aar.title}
                </div>
                <div className="text-xs text-dim">
                  {new Date(aar.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="relative z-10"
                onClick={() => setDeleteTarget(aar.id)}
                title="Delete AAR"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteAAR(deleteTarget);
        }}
        title="Delete AAR"
        message="This will permanently delete this after action report. This cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
