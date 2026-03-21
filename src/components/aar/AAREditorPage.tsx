import { ArrowLeft, Pencil } from 'lucide-react';
import { type KeyboardEvent, useCallback, useMemo, useState } from 'react';
import { useAARsState } from '../../context/AppStateContext';
import { aarHtmlToPlainText } from '../../lib/aar';
import type { Page } from '../../types';
import { Button } from '../common/Button';
import { CopyButton } from '../common/CopyButton';
import { TextInput } from '../common/TextInput';
import { AARTiptapEditor } from './AARTiptapEditor';

interface AAREditorPageProps {
  aarId: string;
  onNavigate: (page: Page, id?: string) => void;
}

export function AAREditorPage({ aarId, onNavigate }: AAREditorPageProps) {
  const { aars, updateAAR } = useAARsState();
  const aar = useMemo(() => aars.find((a) => a.id === aarId), [aars, aarId]);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const handleTitleEditStart = useCallback(() => {
    if (!aar) return;
    setTitleValue(aar.title);
    setEditingTitle(true);
  }, [aar]);

  const handleTitleCommit = useCallback(() => {
    if (!aar) return;
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== aar.title) {
      updateAAR(aar.id, { title: trimmed });
    }
    setEditingTitle(false);
  }, [aar, titleValue, updateAAR]);

  const handleTitleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleTitleCommit();
      if (e.key === 'Escape') setEditingTitle(false);
    },
    [handleTitleCommit],
  );

  const handleContentUpdate = useCallback(
    (html: string) => {
      if (!aar) return;
      updateAAR(aar.id, { content: html });
    },
    [aar, updateAAR],
  );

  const getCopyText = useCallback(() => {
    if (!aar) return '';
    return aarHtmlToPlainText(aar.content);
  }, [aar]);

  if (!aar) {
    return <div className="text-dim text-center py-12">AAR not found.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('aar-list', aar.orbatId)}
          className="shrink-0"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">AARs</span>
        </Button>

        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <TextInput
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleCommit}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              className="text-xl font-bold"
            />
          ) : (
            <button
              type="button"
              className="font-display text-xl font-bold text-strong uppercase tracking-wide truncate cursor-pointer hover:text-accent transition-colors inline-flex items-center gap-2 group/name"
              onClick={handleTitleEditStart}
              title="Click to rename"
            >
              <span className="truncate">{aar.title}</span>
              <Pencil
                size={14}
                className="shrink-0 text-faint group-hover/name:text-accent transition-colors"
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        <CopyButton getText={getCopyText} />
      </div>

      {/* Editor */}
      <AARTiptapEditor content={aar.content} onUpdate={handleContentUpdate} />

      {/* Meta */}
      <div className="text-xs text-dim">
        Created{' '}
        {new Date(aar.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
}
