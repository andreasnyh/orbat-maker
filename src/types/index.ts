export interface Person {
  id: string
  name: string
  rank?: string
}

export interface Slot {
  id: string
  roleLabel: string
}

export interface Group {
  id: string
  name: string
  slots: Slot[]
}

export interface Template {
  id: string
  name: string
  description?: string
  isDefault?: boolean
  groups: Group[]
}

export interface Assignment {
  slotId: string
  personId: string
}

export interface ORBAT {
  id: string
  name: string
  templateId: string
  date?: string
  assignments: Assignment[]
}

export interface ExportBundle {
  version: number
  exportedAt: string
  people?: Person[]
  templates?: Template[]
  orbats?: ORBAT[]
}

export type Page = 'people' | 'templates' | 'template-editor' | 'orbats' | 'orbat-builder'
