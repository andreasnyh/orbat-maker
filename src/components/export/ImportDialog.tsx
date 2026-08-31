import { CheckCircle, Upload } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  useAARsState,
  useOrbatsState,
  usePeopleState,
  useRanksState,
  useTemplatesState,
} from '../../context/AppStateContext';
import {
  allSections,
  applyImport,
  countConflicts,
  countSections,
  describeCounts,
  type ImportPlan,
  type ImportSection,
  type ImportStore,
  type ImportSummary,
  type NameConflict,
  parseImportFile,
  planImport,
  planIsEmpty,
  type SectionSelection,
  type ValidatedBundle,
} from '../../lib/exportImport';
import { AlertBanner } from '../common/AlertBanner';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

type ImportState =
  | { phase: 'idle' }
  | { phase: 'error'; message: string }
  | {
      phase: 'preview' | 'conflicts';
      bundle: ValidatedBundle;
      filename: string;
      warnings: string[];
    }
  | { phase: 'success'; summary: ImportSummary };

const SECTION_LABELS: Record<ImportSection, string> = {
  people: 'Personnel',
  ranks: 'Ranks',
  templates: 'Templates',
  orbats: 'ORBATs',
  aars: 'AARs',
};

function ConflictSection<T extends { id: string; name: string }>({
  title,
  conflicts,
  addAnyway,
  onToggle,
}: {
  title: string;
  conflicts: NameConflict<T>[];
  addAnyway: ReadonlySet<string>;
  onToggle: (id: string, add: boolean) => void;
}) {
  if (conflicts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-dim uppercase tracking-wide">
        {title}
      </h3>
      {conflicts.map((conflict) => {
        const add = addAnyway.has(conflict.incoming.id);
        return (
          <div
            key={conflict.incoming.id}
            className="flex items-center justify-between gap-3 bg-page border border-trim rounded-md px-3 py-2"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm text-body truncate">
                {conflict.incoming.name}
              </span>
              <span className="text-xs text-dim">
                Matches existing: {conflict.existingMatch.name}
              </span>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onToggle(conflict.incoming.id, false)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  add
                    ? 'bg-panel text-dim border border-trim hover:text-sub'
                    : 'bg-caution-dim text-caution border border-caution/40'
                }`}
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => onToggle(conflict.incoming.id, true)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  add
                    ? 'bg-success-dim text-success border border-success/40'
                    : 'bg-panel text-dim border border-trim hover:text-sub'
                }`}
              >
                Add anyway
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const { people, addPeople } = usePeopleState();
  const { ranks, addRanks } = useRanksState();
  const { templates, addTemplates } = useTemplatesState();
  const { orbats, addOrbats } = useOrbatsState();
  const { aars, addAARs } = useAARsState();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>({ phase: 'idle' });
  const [sections, setSections] = useState<SectionSelection>(() =>
    allSections(true),
  );
  const [addAnyway, setAddAnyway] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const bundle =
    state.phase === 'preview' || state.phase === 'conflicts'
      ? state.bundle
      : null;

  const plan = useMemo<ImportPlan | null>(
    () =>
      bundle
        ? planImport(
            bundle,
            { people, ranks, templates, orbats, aars },
            sections,
          )
        : null,
    [bundle, people, ranks, templates, orbats, aars, sections],
  );

  const store = useMemo<ImportStore>(
    () => ({
      addPeople,
      addRanks,
      addTemplates,
      addOrbats,
      addAARs,
    }),
    [addPeople, addRanks, addTemplates, addOrbats, addAARs],
  );

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
      const parsed = parseImportFile(text);
      if (!parsed.ok) {
        setState({ phase: 'error', message: parsed.error });
        return;
      }
      const counts = countSections(parsed.bundle);
      setSections({
        people: counts.people > 0,
        ranks: counts.ranks > 0,
        templates: counts.templates > 0,
        orbats: counts.orbats > 0,
        aars: counts.aars > 0,
      });
      setAddAnyway(new Set());
      setState({
        phase: 'preview',
        bundle: parsed.bundle,
        filename: file.name,
        warnings: parsed.warnings,
      });
    };
    reader.readAsText(file);

    // Reset the input so the same file can be re-selected after an error
    e.target.value = '';
  }

  const runImport = useCallback(
    (target: ImportPlan) => {
      setState({
        phase: 'success',
        summary: applyImport(target, { addAnyway }, store),
      });
    },
    [addAnyway, store],
  );

  function handleImport() {
    if (state.phase !== 'preview' || !plan) return;
    if (countConflicts(plan) > 0) {
      setState({ ...state, phase: 'conflicts' });
      return;
    }
    runImport(plan);
  }

  function toggleConflict(id: string, add: boolean) {
    setAddAnyway((prev) => {
      const next = new Set(prev);
      if (add) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleClose() {
    setState({ phase: 'idle' });
    onClose();
  }

  function handlePickFile() {
    setState({ phase: 'idle' });
    fileInputRef.current?.click();
  }

  const counts = bundle ? countSections(bundle) : null;
  const presentSections = counts
    ? (Object.keys(SECTION_LABELS) as ImportSection[]).filter(
        (section) => counts[section] > 0,
      )
    : [];

  return (
    <Modal open={open} onClose={handleClose} title="Import Data">
      <div className="flex flex-col gap-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          aria-label="Select JSON file to import"
          onChange={handleFileChange}
        />

        {/* Idle / pick file */}
        {(state.phase === 'idle' || state.phase === 'error') && (
          <>
            <p className="text-sm text-dim">
              Select an ORBAT Maker JSON export file. Existing records with
              matching IDs will be skipped; new records will be merged in.
            </p>

            {state.phase === 'error' && (
              <AlertBanner variant="danger">{state.message}</AlertBanner>
            )}

            {/* Drop-zone style button */}
            <button
              type="button"
              onClick={handlePickFile}
              className="w-full border-2 border-dashed border-trim hover:border-accent/50 rounded-lg py-10 flex flex-col items-center gap-3 text-dim hover:text-accent transition-colors cursor-pointer"
            >
              <Upload size={32} />
              <span className="text-sm font-medium">
                Click to select a .json file
              </span>
            </button>
          </>
        )}

        {/* Preview */}
        {state.phase === 'preview' && counts && plan && (
          <>
            <div className="bg-page border border-trim rounded-md p-4 flex flex-col gap-2">
              <p className="text-xs text-dim font-mono truncate">
                {state.filename}
              </p>
              <p className="text-sm text-sub">
                This file contains:{' '}
                <span className="text-accent font-medium">
                  {describeCounts(counts)}
                </span>
              </p>
              {state.bundle.exportedAt && (
                <p className="text-xs text-dim">
                  Exported: {new Date(state.bundle.exportedAt).toLocaleString()}
                </p>
              )}
            </div>

            {[...state.warnings, ...plan.warnings].map((warning) => (
              <AlertBanner key={warning} variant="caution">
                {warning}
              </AlertBanner>
            ))}

            {planIsEmpty(plan) && (
              <AlertBanner variant="caution">
                Nothing new to import — every selected record is already in the
                app.
              </AlertBanner>
            )}

            {/* Section picker — only show when multiple sections exist */}
            {presentSections.length > 1 && (
              <fieldset className="flex flex-col gap-1.5">
                <legend className="text-xs font-semibold text-dim uppercase tracking-wide mb-1">
                  Import sections
                </legend>
                {presentSections.map((section) => (
                  <label
                    key={section}
                    className="flex items-center gap-2 text-sm text-sub cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={sections[section]}
                      onChange={(e) =>
                        setSections((prev) => ({
                          ...prev,
                          [section]: e.target.checked,
                        }))
                      }
                      className="accent-success"
                    />
                    {SECTION_LABELS[section]}{' '}
                    <span className="text-faint">({counts[section]})</span>
                  </label>
                ))}
              </fieldset>
            )}

            <p className="text-xs text-dim">
              Import mode: <span className="text-sub">Merge</span> — records
              whose IDs already exist in the app will be skipped
              {describeCounts(plan.duplicates) !== 'nothing' && (
                <>
                  {' '}
                  (
                  <span className="text-sub">
                    {describeCounts(plan.duplicates)}
                  </span>{' '}
                  in this file)
                </>
              )}
              .
            </p>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handlePickFile}>
                Choose different file
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleImport}
                disabled={planIsEmpty(plan)}
              >
                <Upload size={14} />
                Import
              </Button>
            </div>
          </>
        )}

        {/* Conflicts */}
        {state.phase === 'conflicts' && plan && (
          <>
            <AlertBanner variant="caution">
              {countConflicts(plan)} name{' '}
              {countConflicts(plan) === 1 ? 'conflict' : 'conflicts'} found
            </AlertBanner>

            <p className="text-xs text-dim">
              The following imported items have the same name as existing
              records but different IDs. Choose to skip or add them as
              duplicates.
            </p>

            <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
              <ConflictSection
                title="Personnel"
                conflicts={plan.conflicts.people}
                addAnyway={addAnyway}
                onToggle={toggleConflict}
              />
              <ConflictSection
                title="Ranks"
                conflicts={plan.conflicts.ranks}
                addAnyway={addAnyway}
                onToggle={toggleConflict}
              />
              <ConflictSection
                title="Templates"
                conflicts={plan.conflicts.templates}
                addAnyway={addAnyway}
                onToggle={toggleConflict}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setState({ ...state, phase: 'preview' })}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => runImport(plan)}
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
              <CheckCircle size={40} className="text-accent" />
              <p className="text-body font-medium">Import complete</p>
              <p className="text-sm text-dim">
                Merged {describeCounts(state.summary.added)}.
              </p>
              {describeCounts(state.summary.skipped) !== 'nothing' && (
                <p className="text-xs text-dim">
                  Skipped {describeCounts(state.summary.skipped)} already
                  present or set to skip.
                </p>
              )}
            </div>
            {state.summary.warnings.map((warning) => (
              <AlertBanner key={warning} variant="caution">
                {warning}
              </AlertBanner>
            ))}
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
