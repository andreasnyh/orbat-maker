const META_KEY = 'orbat-maker:meta'
const CURRENT_VERSION = 1

interface SchemaMeta {
  version: number
}

export function initStorage(): void {
  const raw = localStorage.getItem(META_KEY)
  if (!raw) {
    localStorage.setItem(META_KEY, JSON.stringify({ version: CURRENT_VERSION }))
    return
  }
  const meta: SchemaMeta = JSON.parse(raw)
  if (meta.version < CURRENT_VERSION) {
    // Future migrations go here
    meta.version = CURRENT_VERSION
    localStorage.setItem(META_KEY, JSON.stringify(meta))
  }
}
