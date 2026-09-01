import type {
  AAR,
  ExportBundle,
  ORBAT,
  Person,
  Rank,
  Template,
} from '../types';
import {
  sanitizeAAR,
  sanitizeCollection,
  sanitizeOrbat,
  sanitizePerson,
  sanitizeRank,
  sanitizeTemplate,
} from './schema';

const CURRENT_VERSION = 1;

// ---- Export ------------------------------------------------------------------

export function createExportBundle(options: {
  people?: Person[];
  templates?: Template[];
  orbats?: ORBAT[];
  ranks?: Rank[];
  aars?: AAR[];
}): ExportBundle {
  return {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    ...options,
  };
}

/**
 * What the given ORBATs need to survive an import: the templates they render
 * against, and the people their assignments name. An ORBAT whose template is
 * absent is dropped outright; assignments naming absent people are pruned,
 * which lands the ORBAT empty. Filtered rather than wholesale, so an ORBAT
 * export carries what it depends on and not the user's entire roster.
 */
export function dependenciesOf(
  orbats: ORBAT[],
  source: { templates: Template[]; people: Person[] },
): { templates: Template[]; people: Person[] } {
  const templateIds = new Set(orbats.map((orbat) => orbat.templateId));
  const personIds = new Set(
    orbats.flatMap((orbat) => orbat.assignments.map((a) => a.personId)),
  );
  return {
    templates: source.templates.filter((t) => templateIds.has(t.id)),
    people: source.people.filter((p) => personIds.has(p.id)),
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

export function generateFilename(
  type: 'people' | 'templates' | 'aars' | 'all',
): string {
  const date = new Date().toISOString().split('T')[0];
  const label = type === 'people' ? 'personnel' : type;
  return `orbat-maker-${label}-${date}.json`;
}

// ---- Sections ----------------------------------------------------------------

export const IMPORT_SECTIONS = [
  'people',
  'ranks',
  'templates',
  'orbats',
  'aars',
] as const;

export type ImportSection = (typeof IMPORT_SECTIONS)[number];
export type SectionSelection = Record<ImportSection, boolean>;
export type SectionCounts = Record<ImportSection, number>;

/** The collections an import merges into. */
export interface ImportTargets {
  people: Person[];
  ranks: Rank[];
  templates: Template[];
  orbats: ORBAT[];
  aars: AAR[];
}

/** A bundle whose records have all been through the sanitizers. */
export interface ValidatedBundle extends ImportTargets {
  version: number;
  exportedAt: string;
}

const SECTION_LABELS: Record<ImportSection, string> = {
  people: 'personnel',
  ranks: 'ranks',
  templates: 'templates',
  orbats: 'ORBATs',
  aars: 'AARs',
};

export function allSections(selected: boolean): SectionSelection {
  return {
    people: selected,
    ranks: selected,
    templates: selected,
    orbats: selected,
    aars: selected,
  };
}

export function countSections(bundle: ValidatedBundle): SectionCounts {
  return {
    people: bundle.people.length,
    ranks: bundle.ranks.length,
    templates: bundle.templates.length,
    orbats: bundle.orbats.length,
    aars: bundle.aars.length,
  };
}

export function describeCounts(counts: SectionCounts): string {
  const parts = IMPORT_SECTIONS.filter((s) => counts[s] > 0).map(
    (s) => `${counts[s]} ${SECTION_LABELS[s]}`,
  );
  return parts.length ? parts.join(', ') : 'nothing';
}

// ---- Parse -------------------------------------------------------------------

export type ParsedImport =
  | { ok: false; error: string }
  | { ok: true; bundle: ValidatedBundle; warnings: string[] };

/**
 * Parse and validate an import file. Nothing downstream of here ever sees a
 * record the sanitizers rejected: a bad file is refused outright, and a file
 * with bad records loses those records and says so.
 */
export function parseImportFile(text: string): ParsedImport {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Invalid JSON file' };
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, error: 'Invalid file: not an ORBAT Maker export' };
  }

  const raw = data as Record<string, unknown>;
  if (typeof raw.version !== 'number' || typeof raw.exportedAt !== 'string') {
    return { ok: false, error: 'Invalid file: missing version or exportedAt' };
  }
  if (raw.version > CURRENT_VERSION) {
    return {
      ok: false,
      error: `Unsupported file version ${raw.version} — this app reads version ${CURRENT_VERSION}`,
    };
  }

  const people = sanitizeCollection(raw.people, sanitizePerson);
  const ranks = sanitizeCollection(raw.ranks, sanitizeRank);
  const templates = sanitizeCollection(raw.templates, sanitizeTemplate);
  const orbats = sanitizeCollection(raw.orbats, sanitizeOrbat);
  const aars = sanitizeCollection(raw.aars, sanitizeAAR);

  const bundle: ValidatedBundle = {
    version: raw.version,
    exportedAt: raw.exportedAt,
    people: people.valid,
    ranks: ranks.valid,
    // Defaults are seeded locally; an imported template is always the user's.
    templates: templates.valid.map(asUserTemplate),
    orbats: orbats.valid,
    aars: aars.valid,
  };

  const rejected: SectionCounts = {
    people: people.rejected,
    ranks: ranks.rejected,
    templates: templates.rejected,
    orbats: orbats.rejected,
    aars: aars.rejected,
  };
  const warnings = IMPORT_SECTIONS.filter((s) => rejected[s] > 0).map(
    (s) =>
      `Ignored ${rejected[s]} unreadable ${SECTION_LABELS[s]} ${
        rejected[s] === 1 ? 'record' : 'records'
      } in this file.`,
  );

  return { ok: true, bundle, warnings };
}

function asUserTemplate(template: Template): Template {
  if (!template.isDefault) return template;
  const { id, name, description, groups } = template;
  const user: Template = { id, name, groups };
  if (description !== undefined) user.description = description;
  return user;
}

// ---- Plan --------------------------------------------------------------------

export interface NameConflict<T> {
  incoming: T;
  existingMatch: T;
}

export interface ImportPlan {
  /** Records that merge in untouched. */
  additions: ImportTargets;
  /** Incoming records whose name matches an existing record with another id. */
  conflicts: {
    people: NameConflict<Person>[];
    ranks: NameConflict<Rank>[];
    templates: NameConflict<Template>[];
  };
  /** Records skipped because their id is already present. */
  duplicates: SectionCounts;
  warnings: string[];
  /** What the plan was computed against — apply needs it to keep refs sound. */
  existing: ExistingIds;
}

interface ExistingIds {
  people: Set<string>;
  templates: Set<string>;
  slots: Set<string>;
}

interface Split<T> {
  additions: T[];
  conflicts: NameConflict<T>[];
  duplicates: number;
}

function splitByIdAndName<T extends { id: string; name: string }>(
  incoming: T[],
  existing: T[],
): Split<T> {
  const existingIds = new Set(existing.map((item) => item.id));
  const existingByName = new Map<string, T>();
  for (const item of existing) {
    existingByName.set(item.name.trim().toLowerCase(), item);
  }

  const result: Split<T> = { additions: [], conflicts: [], duplicates: 0 };
  for (const item of incoming) {
    if (existingIds.has(item.id)) {
      result.duplicates++;
      continue;
    }
    const match = existingByName.get(item.name.trim().toLowerCase());
    if (match) {
      result.conflicts.push({ incoming: item, existingMatch: match });
    } else {
      result.additions.push(item);
    }
  }
  return result;
}

function splitById<T extends { id: string }>(
  incoming: T[],
  existing: T[],
): { additions: T[]; duplicates: number } {
  const existingIds = new Set(existing.map((item) => item.id));
  const additions = incoming.filter((item) => !existingIds.has(item.id));
  return { additions, duplicates: incoming.length - additions.length };
}

function slotIdsOf(templates: Template[]): Set<string> {
  const ids = new Set<string>();
  for (const template of templates) {
    for (const group of template.groups) {
      for (const slot of group.slots) ids.add(slot.id);
    }
  }
  return ids;
}

/**
 * Work out what importing this bundle would do, without doing any of it.
 * Deselected sections contribute nothing.
 */
export function planImport(
  bundle: ValidatedBundle,
  current: ImportTargets,
  sections: SectionSelection,
): ImportPlan {
  const selected = <T>(section: ImportSection, items: T[]): T[] =>
    sections[section] ? items : [];

  const people = splitByIdAndName(
    selected('people', bundle.people),
    current.people,
  );
  const ranks = splitByIdAndName(
    selected('ranks', bundle.ranks),
    current.ranks,
  );
  const templates = splitByIdAndName(
    selected('templates', bundle.templates),
    current.templates,
  );
  const orbats = splitById(selected('orbats', bundle.orbats), current.orbats);
  const aars = splitById(selected('aars', bundle.aars), current.aars);

  const duplicates: SectionCounts = {
    people: people.duplicates,
    ranks: ranks.duplicates,
    templates: templates.duplicates,
    orbats: orbats.duplicates,
    aars: aars.duplicates,
  };

  const warnings: string[] = [];

  // Reference checks against everything that could exist after the import.
  const reachableTemplateIds = new Set([
    ...current.templates.map((t) => t.id),
    ...selected('templates', bundle.templates).map((t) => t.id),
  ]);
  const orphanOrbats = orbats.additions.filter(
    (o) => !reachableTemplateIds.has(o.templateId),
  );
  if (orphanOrbats.length > 0) {
    warnings.push(
      `${orphanOrbats.length} ORBAT${orphanOrbats.length === 1 ? '' : 's'} reference a template that is neither in this file nor in your data, and will be skipped.`,
    );
  }

  const reachableOrbatIds = new Set([
    ...current.orbats.map((o) => o.id),
    ...selected('orbats', bundle.orbats).map((o) => o.id),
  ]);
  const orphanAARs = aars.additions.filter(
    (a) => !reachableOrbatIds.has(a.orbatId),
  );
  if (orphanAARs.length > 0) {
    warnings.push(
      `${orphanAARs.length} AAR${orphanAARs.length === 1 ? '' : 's'} reference an ORBAT that is neither in this file nor in your data — they will import but stay out of reach until that ORBAT exists.`,
    );
  }

  return {
    additions: {
      people: people.additions,
      ranks: ranks.additions,
      templates: templates.additions,
      orbats: orbats.additions,
      aars: aars.additions,
    },
    conflicts: {
      people: people.conflicts,
      ranks: ranks.conflicts,
      templates: templates.conflicts,
    },
    duplicates,
    warnings,
    existing: {
      people: new Set(current.people.map((p) => p.id)),
      templates: new Set(current.templates.map((t) => t.id)),
      slots: slotIdsOf(current.templates),
    },
  };
}

export function planIsEmpty(plan: ImportPlan): boolean {
  const { additions, conflicts } = plan;
  return (
    additions.people.length === 0 &&
    additions.ranks.length === 0 &&
    additions.templates.length === 0 &&
    additions.orbats.length === 0 &&
    additions.aars.length === 0 &&
    conflicts.people.length === 0 &&
    conflicts.ranks.length === 0 &&
    conflicts.templates.length === 0
  );
}

export function countConflicts(plan: ImportPlan): number {
  return (
    plan.conflicts.people.length +
    plan.conflicts.ranks.length +
    plan.conflicts.templates.length
  );
}

// ---- Apply -------------------------------------------------------------------

/** How the user resolved the plan's name conflicts. Unlisted ids are skipped. */
export interface ConflictResolutions {
  addAnyway: ReadonlySet<string>;
}

/** The store side of the seam: append records that are new by id. */
export interface ImportStore {
  addPeople(items: Person[]): void;
  addRanks(items: Rank[]): void;
  addTemplates(items: Template[]): void;
  addOrbats(items: ORBAT[]): void;
  addAARs(items: AAR[]): void;
}

export interface ImportSummary {
  added: SectionCounts;
  skipped: SectionCounts;
  warnings: string[];
}

interface Resolved<T> {
  records: T[];
  /** Conflicting records the user left on "skip". */
  skipped: number;
}

function resolve<T extends { id: string }>(
  additions: T[],
  conflicts: NameConflict<T>[],
  resolutions: ConflictResolutions,
): Resolved<T> {
  const kept = conflicts
    .filter((c) => resolutions.addAnyway.has(c.incoming.id))
    .map((c) => c.incoming);
  return {
    records: [...additions, ...kept],
    skipped: conflicts.length - kept.length,
  };
}

/**
 * Carry out a plan. Records reach the stores only through this function, which
 * is also where cross-collection references are made sound: an ORBAT whose
 * template did not survive is dropped, and assignments pointing at people or
 * slots that will not exist are pruned rather than left dangling.
 */
export function applyImport(
  plan: ImportPlan,
  resolutions: ConflictResolutions,
  store: ImportStore,
): ImportSummary {
  const people = resolve(
    plan.additions.people,
    plan.conflicts.people,
    resolutions,
  );
  const ranks = resolve(
    plan.additions.ranks,
    plan.conflicts.ranks,
    resolutions,
  );
  const templates = resolve(
    plan.additions.templates,
    plan.conflicts.templates,
    resolutions,
  );

  const finalPersonIds = new Set([
    ...plan.existing.people,
    ...people.records.map((p) => p.id),
  ]);
  const finalTemplateIds = new Set([
    ...plan.existing.templates,
    ...templates.records.map((t) => t.id),
  ]);
  const finalSlotIds = new Set([
    ...plan.existing.slots,
    ...slotIdsOf(templates.records),
  ]);

  const warnings: string[] = [];
  let droppedOrbats = 0;
  let prunedRefs = 0;

  const orbats: ORBAT[] = [];
  for (const orbat of plan.additions.orbats) {
    if (!finalTemplateIds.has(orbat.templateId)) {
      droppedOrbats++;
      continue;
    }
    const assignments = orbat.assignments.filter(
      (a) => finalSlotIds.has(a.slotId) && finalPersonIds.has(a.personId),
    );
    const buddyTeams = orbat.buddyTeams?.filter((b) =>
      finalSlotIds.has(b.slotId),
    );
    prunedRefs +=
      orbat.assignments.length -
      assignments.length +
      ((orbat.buddyTeams?.length ?? 0) - (buddyTeams?.length ?? 0));
    orbats.push(
      buddyTeams
        ? { ...orbat, assignments, buddyTeams }
        : { ...orbat, assignments },
    );
  }

  const aars = plan.additions.aars;

  if (droppedOrbats > 0) {
    warnings.push(
      `Skipped ${droppedOrbats} ORBAT${droppedOrbats === 1 ? '' : 's'} whose template was not imported.`,
    );
  }
  if (prunedRefs > 0) {
    warnings.push(
      `Cleared ${prunedRefs} assignment${prunedRefs === 1 ? '' : 's'} pointing at personnel or slots that were not imported.`,
    );
  }

  if (people.records.length > 0) store.addPeople(people.records);
  if (ranks.records.length > 0) store.addRanks(ranks.records);
  if (templates.records.length > 0) store.addTemplates(templates.records);
  if (orbats.length > 0) store.addOrbats(orbats);
  if (aars.length > 0) store.addAARs(aars);

  const added: SectionCounts = {
    people: people.records.length,
    ranks: ranks.records.length,
    templates: templates.records.length,
    orbats: orbats.length,
    aars: aars.length,
  };

  const skipped: SectionCounts = {
    people: plan.duplicates.people + people.skipped,
    ranks: plan.duplicates.ranks + ranks.skipped,
    templates: plan.duplicates.templates + templates.skipped,
    orbats: plan.duplicates.orbats + droppedOrbats,
    aars: plan.duplicates.aars,
  };

  return { added, skipped, warnings };
}
