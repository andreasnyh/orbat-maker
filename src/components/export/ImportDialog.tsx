import { AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import {
  type Conflict,
  describeBundle,
  describeImportPreview,
  detectNameConflicts,
  parseImportFile,
} from '../../lib/exportImport';
import type { ExportBundle, Person, Template } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

type ImportState =
  | { phase: 'idle' }
  | { phase: 'preview'; bundle: ExportBundle; filename: string }
  | {
      phase: 'conflicts';
      bundle: ExportBundle;
      filename: string;
      peopleConflicts: Conflict<Person>[];
      templateConflicts: Conflict<Template>[];
    }
  | { phase: 'error'; message: string }
  | { phase: 'success'; description: string };

function ConflictSection<T extends { id: string; name: string }>({
  title,
  conflicts,
  onToggle,
}: {
  title: string;
  conflicts: Conflict<T>[];
  onToggle: (index: number, resolution: 'skip' | 'add') => void;
}) {
  if (conflicts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        {title}
      </h4>
      {conflicts.map((conflict, i) => (
        <div
          key={conflict.incoming.id}
          className="flex items-center justify-between gap-3 bg-[#0f0f23] border border-[#2a2a4a] rounded-md px-3 py-2"
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm text-gray-200 truncate">
              {conflict.incoming.name}
            </span>
            <span className="text-xs text-gray-500">
              Matches existing: {conflict.existingMatch.name}
            </span>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => onToggle(i, 'skip')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                conflict.resolution === 'skip'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-[#1a1a2e] text-gray-500 border border-[#2a2a4a] hover:text-gray-300'
              }`}
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => onToggle(i, 'add')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                conflict.resolution === 'add'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                  : 'bg-[#1a1a2e] text-gray-500 border border-[#2a2a4a] hover:text-gray-300'
              }`}
            >
              Add anyway
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const { people, setPeople, templates, setTemplates } = useAppState();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>({ phase: 'idle' });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') {
        setState({ phase: 'error', message: 'Failed to read file.' });
        return;
      }
      const { bundle, error } = parseImportFile(text);
      if (error) {
        setState({ phase: 'error', message: error });
      } else {
        setState({ phase: 'preview', bundle, filename: file.name });
      }
    };
    reader.readAsText(file);

    // Reset the input so the same file can be re-selected after an error
    e.target.value = '';
  }

  function performImport(
    bundle: ExportBundle,
    skippedPeopleIds: Set<string>,
    skippedTemplateIds: Set<string>,
  ) {
    if (bundle.people?.length) {
      const existingIds = new Set(people.map((p) => p.id));
      const newPeople = bundle.people.filter(
        (p) => !existingIds.has(p.id) && !skippedPeopleIds.has(p.id),
      );
      if (newPeople.length > 0) {
        setPeople((prev) => [...prev, ...newPeople]);
      }
    }

    if (bundle.templates?.length) {
      const existingIds = new Set(templates.map((t) => t.id));
      const newTemplates = bundle.templates.filter(
        (t) => !existingIds.has(t.id) && !skippedTemplateIds.has(t.id),
      );
      if (newTemplates.length > 0) {
        setTemplates((prev) => [...prev, ...newTemplates]);
      }
    }

    setState({ phase: 'success', description: describeBundle(bundle) });
  }

  function handleImport() {
    if (state.phase !== 'preview') return;
    const { bundle, filename } = state;

    const peopleConflicts = bundle.people?.length
      ? detectNameConflicts(bundle.people, people)
      : [];
    const templateConflicts = bundle.templates?.length
      ? detectNameConflicts(bundle.templates, templates)
      : [];

    if (peopleConflicts.length > 0 || templateConflicts.length > 0) {
      setState({
        phase: 'conflicts',
        bundle,
        filename,
        peopleConflicts,
        templateConflicts,
      });
      return;
    }

    performImport(bundle, new Set(), new Set());
  }

  function handleConfirmedImport() {
    if (state.phase !== 'conflicts') return;
    const { bundle, peopleConflicts, templateConflicts } = state;

    const skippedPeopleIds = new Set(
      peopleConflicts
        .filter((c) => c.resolution === 'skip')
        .map((c) => c.incoming.id),
    );
    const skippedTemplateIds = new Set(
      templateConflicts
        .filter((c) => c.resolution === 'skip')
        .map((c) => c.incoming.id),
    );

    performImport(bundle, skippedPeopleIds, skippedTemplateIds);
  }

  function handleClose() {
    setState({ phase: 'idle' });
    onClose();
  }

  function handlePickFile() {
    setState({ phase: 'idle' });
    fileInputRef.current?.click();
  }

  const totalConflicts =
    state.phase === 'conflicts'
      ? state.peopleConflicts.length + state.templateConflicts.length
      : 0;

  return (
    <Modal open={open} onClose={handleClose} title="Import Data">
      <div className="flex flex-col gap-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Idle / pick file */}
        {(state.phase === 'idle' || state.phase === 'error') && (
          <>
            <p className="text-sm text-gray-400">
              Select an ORBAT Maker JSON export file. Existing records with
              matching IDs will be skipped; new records will be merged in.
            </p>

            {state.phase === 'error' && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-md p-3 text-red-400 text-sm">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{state.message}</span>
              </div>
            )}

            {/* Drop-zone style button */}
            <button
              type="button"
              onClick={handlePickFile}
              className="w-full border-2 border-dashed border-[#2a2a4a] hover:border-green-500/50 rounded-lg py-10 flex flex-col items-center gap-3 text-gray-500 hover:text-green-400 transition-colors cursor-pointer"
            >
              <Upload size={32} />
              <span className="text-sm font-medium">
                Click to select a .json file
              </span>
            </button>
          </>
        )}

        {/* Preview */}
        {state.phase === 'preview' && (
          <>
            <div className="bg-[#0f0f23] border border-[#2a2a4a] rounded-md p-4 flex flex-col gap-2">
              <p className="text-xs text-gray-500 font-mono truncate">
                {state.filename}
              </p>
              <p className="text-sm text-gray-300">
                This file contains:{' '}
                <span className="text-green-400 font-medium">
                  {describeBundle(state.bundle)}
                </span>
              </p>
              {state.bundle.exportedAt && (
                <p className="text-xs text-gray-600">
                  Exported: {new Date(state.bundle.exportedAt).toLocaleString()}
                </p>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Import mode: <span className="text-gray-300">Merge</span> —
              records whose IDs already exist in the app will be skipped.
            </p>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handlePickFile}>
                Choose different file
              </Button>
              <Button variant="primary" size="sm" onClick={handleImport}>
                <Upload size={14} />
                Import
              </Button>
            </div>
          </>
        )}

        {/* Conflicts */}
        {state.phase === 'conflicts' && (
          <>
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-amber-300 text-sm">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>
                {totalConflicts} name{' '}
                {totalConflicts === 1 ? 'conflict' : 'conflicts'} found
              </span>
            </div>

            <p className="text-xs text-gray-400">
              The following imported items have the same name as existing
              records but different IDs. Choose to skip or add them as
              duplicates.
            </p>

            <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
              <ConflictSection
                title="People"
                conflicts={state.peopleConflicts}
                onToggle={(i, resolution) =>
                  setState((prev) => {
                    if (prev.phase !== 'conflicts') return prev;
                    const updated = [...prev.peopleConflicts];
                    updated[i] = { ...updated[i], resolution };
                    return { ...prev, peopleConflicts: updated };
                  })
                }
              />
              <ConflictSection
                title="Templates"
                conflicts={state.templateConflicts}
                onToggle={(i, resolution) =>
                  setState((prev) => {
                    if (prev.phase !== 'conflicts') return prev;
                    const updated = [...prev.templateConflicts];
                    updated[i] = { ...updated[i], resolution };
                    return { ...prev, templateConflicts: updated };
                  })
                }
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setState({
                    phase: 'preview',
                    bundle: state.bundle,
                    filename: state.filename,
                  })
                }
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmedImport}
              >
                Continue Import
              </Button>
            </div>
          </>
        )}

        {/* Success */}
        {state.phase === 'success' && (
          <>
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle size={40} className="text-green-400" />
              <p className="text-gray-200 font-medium">Import complete</p>
              <p className="text-sm text-gray-400">
                {state.description} merged successfully.
              </p>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={handleClose}>
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
