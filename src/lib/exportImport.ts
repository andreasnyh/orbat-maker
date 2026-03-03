import type { ExportBundle, ORBAT, Person, Template } from '../types';

const CURRENT_VERSION = 1;

export function createExportBundle(options: {
  people?: Person[];
  templates?: Template[];
  orbats?: ORBAT[];
}): ExportBundle {
  return {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    ...options,
  };
}

export function downloadJson(bundle: ExportBundle, filename: string): void {
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function generateFilename(type: 'people' | 'templates' | 'all'): string {
  const date = new Date().toISOString().split('T')[0];
  return `orbat-maker-${type}-${date}.json`;
}

export function parseImportFile(text: string): {
  bundle: ExportBundle;
  error?: string;
} {
  try {
    const data = JSON.parse(text);
    if (!data.version || !data.exportedAt) {
      return {
        bundle: data,
        error: 'Invalid file: missing version or exportedAt',
      };
    }
    return { bundle: data };
  } catch {
    return { bundle: {} as ExportBundle, error: 'Invalid JSON file' };
  }
}

export function describeBundle(bundle: ExportBundle): string {
  const parts: string[] = [];
  if (bundle.people?.length) parts.push(`${bundle.people.length} people`);
  if (bundle.templates?.length)
    parts.push(`${bundle.templates.length} templates`);
  if (bundle.orbats?.length) parts.push(`${bundle.orbats.length} ORBATs`);
  return parts.length ? parts.join(', ') : 'Empty file';
}
