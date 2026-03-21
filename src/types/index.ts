export interface Rank {
  id: string;
  name: string;
}

export interface Person {
  id: string;
  name: string;
  rank?: string;
}

export interface Slot {
  id: string;
  roleLabel: string;
  equipment?: string[];
}

export interface Group {
  id: string;
  name: string;
  color?: string;
  slots: Slot[];
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  groups: Group[];
}

export interface Assignment {
  slotId: string;
  personId: string;
}

export interface ORBAT {
  id: string;
  name: string;
  templateId: string;
  assignments: Assignment[];
}

export interface AAR {
  id: string;
  orbatId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportBundle {
  version: number;
  exportedAt: string;
  people?: Person[];
  templates?: Template[];
  orbats?: ORBAT[];
  ranks?: Rank[];
  aars?: AAR[];
}

export function isActivePage(page: Page, currentPage: Page): boolean {
  if (page === currentPage) return true;
  if (page === 'templates' && currentPage === 'template-editor') return true;
  if (
    page === 'orbats' &&
    (currentPage === 'orbat-builder' ||
      currentPage === 'aar-list' ||
      currentPage === 'aar-editor')
  )
    return true;
  return false;
}

export type Page =
  | 'people'
  | 'ranks'
  | 'templates'
  | 'template-editor'
  | 'orbats'
  | 'orbat-builder'
  | 'aar-list'
  | 'aar-editor'
  | 'about';
