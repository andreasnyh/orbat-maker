import { AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { describeBundle, parseImportFile } from '../../lib/exportImport';
import type { ExportBundle } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

type ImportState =
  | { phase: 'idle' }
  | { phase: 'preview'; bundle: ExportBundle; filename: string }
  | { phase: 'error'; message: string }
  | { phase: 'success'; description: string };

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

  function handleImport() {
    if (state.phase !== 'preview') return;
    const { bundle } = state;

    // Merge people — skip IDs that already exist
    if (bundle.people?.length) {
      const existingIds = new Set(people.map((p) => p.id));
      const newPeople = bundle.people.filter((p) => !existingIds.has(p.id));
      if (newPeople.length > 0) {
        setPeople((prev) => [...prev, ...newPeople]);
      }
    }

    // Merge templates — skip IDs that already exist
    if (bundle.templates?.length) {
      const existingIds = new Set(templates.map((t) => t.id));
      const newTemplates = bundle.templates.filter(
        (t) => !existingIds.has(t.id),
      );
      if (newTemplates.length > 0) {
        setTemplates((prev) => [...prev, ...newTemplates]);
      }
    }

    setState({ phase: 'success', description: describeBundle(bundle) });
  }

  function handleClose() {
    setState({ phase: 'idle' });
    onClose();
  }

  function handlePickFile() {
    setState({ phase: 'idle' });
    fileInputRef.current?.click();
  }

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
