import { describe, expect, it } from 'vitest';
import type { AAR, ORBAT, Person, Rank, Template } from '../types';
import {
  allSections,
  applyImport,
  countConflicts,
  createExportBundle,
  dependenciesOf,
  type ImportStore,
  type ImportTargets,
  parseImportFile,
  planImport,
  type SectionSelection,
  type ValidatedBundle,
} from './exportImport';

// ---- Fixtures ----------------------------------------------------------------

const nyx: Person = { id: 'p1', name: 'Nyx', rank: 'SGT' };
const vex: Person = { id: 'p2', name: 'Vex' };
const sergeant: Rank = { id: 'r1', name: 'SGT' };

const squad: Template = {
  id: 't1',
  name: 'Rifle Squad',
  description: 'Two fireteams',
  groups: [
    {
      id: 'g1',
      name: 'Alpha',
      color: 'red',
      slots: [
        { id: 's1', roleLabel: 'Team Leader' },
        { id: 's2', roleLabel: 'Rifleman', equipment: ['M4'] },
      ],
    },
  ],
};

const redwood: ORBAT = {
  id: 'o1',
  name: 'Op Redwood',
  templateId: 't1',
  assignments: [
    { slotId: 's1', personId: 'p1' },
    { slotId: 's2', personId: 'p2' },
  ],
  buddyTeams: [{ slotId: 's1', team: 1 }],
};

const redwoodAAR: AAR = {
  id: 'a1',
  orbatId: 'o1',
  title: 'Op Redwood AAR',
  content: '<p>Objective secured.</p>',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

function empty(): ImportTargets {
  return { people: [], ranks: [], templates: [], orbats: [], aars: [] };
}

function bundleOf(parts: Partial<ImportTargets>): ValidatedBundle {
  return {
    version: 1,
    exportedAt: '2026-08-31T09:48:10.000Z',
    ...empty(),
    ...parts,
  };
}

/** The store side of the seam, recorded instead of persisted. */
function fakeStore(): ImportStore & { written: ImportTargets } {
  const written = empty();
  return {
    written,
    addPeople: (items) => written.people.push(...items),
    addRanks: (items) => written.ranks.push(...items),
    addTemplates: (items) => written.templates.push(...items),
    addOrbats: (items) => written.orbats.push(...items),
    addAARs: (items) => written.aars.push(...items),
  };
}

function importInto(
  current: ImportTargets,
  bundle: ValidatedBundle,
  options: { addAnyway?: string[]; sections?: SectionSelection } = {},
) {
  const plan = planImport(
    bundle,
    current,
    options.sections ?? allSections(true),
  );
  const store = fakeStore();
  const summary = applyImport(
    plan,
    { addAnyway: new Set(options.addAnyway ?? []) },
    store,
  );
  return { plan, summary, written: store.written };
}

// ---- Parsing -----------------------------------------------------------------

describe('parseImportFile', () => {
  it('refuses files that are not an export bundle', () => {
    expect(parseImportFile('not json')).toEqual({
      ok: false,
      error: 'Invalid JSON file',
    });
    expect(parseImportFile('[]')).toEqual({
      ok: false,
      error: 'Invalid file: not an ORBAT Maker export',
    });
    expect(parseImportFile('{"people":[]}')).toEqual({
      ok: false,
      error: 'Invalid file: missing version or exportedAt',
    });
    expect(
      parseImportFile('{"version":"1","exportedAt":"2026-01-01"}').ok,
    ).toBe(false);
  });

  it('refuses a file written by a newer app', () => {
    const parsed = parseImportFile(
      '{"version":2,"exportedAt":"2026-01-01T00:00:00.000Z"}',
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok)
      expect(parsed.error).toContain('Unsupported file version 2');
  });

  it('drops records that would crash a render, and says so', () => {
    // The shipped bug: {id} with no name merged into localStorage, then
    // p.name.toLowerCase() threw on the next render — a crash that survived
    // reload because the bad record was already persisted.
    const parsed = parseImportFile(
      JSON.stringify({
        version: 1,
        exportedAt: '2026-01-01T00:00:00.000Z',
        people: [{ id: 'p1' }, nyx],
      }),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.bundle.people).toEqual([nyx]);
    expect(parsed.warnings).toEqual([
      'Ignored 1 unreadable personnel record in this file.',
    ]);
  });

  it('never imports a template as a default', () => {
    const parsed = parseImportFile(
      JSON.stringify({
        version: 1,
        exportedAt: '2026-01-01T00:00:00.000Z',
        templates: [{ ...squad, isDefault: true }],
      }),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.bundle.templates[0]).toEqual(squad);
  });
});

// ---- Planning ----------------------------------------------------------------

describe('planImport', () => {
  it('splits incoming records into additions, duplicates and conflicts', () => {
    const current: ImportTargets = {
      ...empty(),
      people: [nyx, { id: 'p9', name: 'Vex' }],
    };
    const plan = planImport(
      bundleOf({ people: [nyx, vex, { id: 'p3', name: 'Kilo' }] }),
      current,
      allSections(true),
    );

    expect(plan.additions.people).toEqual([{ id: 'p3', name: 'Kilo' }]);
    expect(plan.duplicates.people).toBe(1);
    expect(plan.conflicts.people).toEqual([
      { incoming: vex, existingMatch: { id: 'p9', name: 'Vex' } },
    ]);
    expect(countConflicts(plan)).toBe(1);
  });

  it('matches names case- and whitespace-insensitively', () => {
    const plan = planImport(
      bundleOf({ people: [{ id: 'p2', name: '  nyx ' }] }),
      { ...empty(), people: [nyx] },
      allSections(true),
    );
    expect(plan.conflicts.people).toHaveLength(1);
    expect(plan.additions.people).toEqual([]);
  });

  it('ignores deselected sections entirely', () => {
    const plan = planImport(
      bundleOf({ people: [nyx], ranks: [sergeant] }),
      empty(),
      { ...allSections(true), people: false },
    );
    expect(plan.additions.people).toEqual([]);
    expect(plan.additions.ranks).toEqual([sergeant]);
  });

  it('warns about references this file cannot satisfy', () => {
    const plan = planImport(
      bundleOf({ orbats: [redwood], aars: [redwoodAAR] }),
      empty(),
      allSections(true),
    );
    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0]).toContain('1 ORBAT');
  });

  it('stays quiet when the bundle carries what it references', () => {
    const plan = planImport(
      bundleOf({ templates: [squad], orbats: [redwood], aars: [redwoodAAR] }),
      empty(),
      allSections(true),
    );
    expect(plan.warnings).toEqual([]);
  });
});

// ---- Applying ----------------------------------------------------------------

describe('applyImport', () => {
  it('writes only the additions when conflicts are left on skip', () => {
    const { written, summary } = importInto(
      { ...empty(), people: [{ id: 'p9', name: 'Vex' }] },
      bundleOf({ people: [vex, nyx] }),
    );
    expect(written.people).toEqual([nyx]);
    expect(summary.added.people).toBe(1);
    expect(summary.skipped.people).toBe(1);
  });

  it('writes a conflicting record when the user says add anyway', () => {
    const { written, summary } = importInto(
      { ...empty(), people: [{ id: 'p9', name: 'Vex' }] },
      bundleOf({ people: [vex] }),
      { addAnyway: ['p2'] },
    );
    expect(written.people).toEqual([vex]);
    expect(summary.added.people).toBe(1);
    expect(summary.skipped.people).toBe(0);
  });

  it('writes nothing for records that are already present by id', () => {
    const { written, summary } = importInto(
      { ...empty(), people: [nyx] },
      bundleOf({ people: [nyx] }),
    );
    expect(written.people).toEqual([]);
    expect(summary.skipped.people).toBe(1);
  });

  it('drops an ORBAT whose template did not come with it', () => {
    const { written, summary } = importInto(
      empty(),
      bundleOf({ orbats: [redwood] }),
    );
    expect(written.orbats).toEqual([]);
    expect(summary.skipped.orbats).toBe(1);
    expect(summary.warnings[0]).toContain('template was not imported');
  });

  it('drops an ORBAT whose template the user chose to skip', () => {
    const { written } = importInto(
      { ...empty(), templates: [{ ...squad, id: 'other' }] },
      bundleOf({ templates: [squad], orbats: [redwood] }),
    );
    // squad conflicts by name with the existing template and stays skipped,
    // so the ORBAT pointing at t1 has nothing to render against.
    expect(written.templates).toEqual([]);
    expect(written.orbats).toEqual([]);
  });

  it('prunes assignments pointing at personnel that were not imported', () => {
    const { written, summary } = importInto(
      empty(),
      bundleOf({ templates: [squad], people: [nyx], orbats: [redwood] }),
    );
    expect(written.orbats[0].assignments).toEqual([
      { slotId: 's1', personId: 'p1' },
    ]);
    expect(written.orbats[0].buddyTeams).toEqual([{ slotId: 's1', team: 1 }]);
    expect(summary.warnings[0]).toContain('Cleared 1 assignment');
  });

  it('keeps assignments that resolve against data already on this machine', () => {
    const { written, summary } = importInto(
      { ...empty(), templates: [squad], people: [nyx, vex] },
      bundleOf({ orbats: [redwood] }),
    );
    expect(written.orbats).toEqual([redwood]);
    expect(summary.warnings).toEqual([]);
  });

  it('imports AARs even when their ORBAT is missing, having warned first', () => {
    const { plan, written } = importInto(
      empty(),
      bundleOf({ aars: [redwoodAAR] }),
    );
    expect(plan.warnings[0]).toContain('1 AAR');
    expect(written.aars).toEqual([redwoodAAR]);
  });
});

// ---- Round trip --------------------------------------------------------------

describe('export/import round trip', () => {
  it('restores an "export all" bundle exactly on a fresh machine', () => {
    const bundle = createExportBundle({
      people: [nyx, vex],
      ranks: [sergeant],
      templates: [squad],
      orbats: [redwood],
      aars: [redwoodAAR],
    });

    const parsed = parseImportFile(JSON.stringify(bundle, null, 2));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.warnings).toEqual([]);

    const { written, summary } = importInto(empty(), parsed.bundle);
    expect(written).toEqual({
      people: [nyx, vex],
      ranks: [sergeant],
      templates: [squad],
      orbats: [redwood],
      aars: [redwoodAAR],
    });
    expect(summary.warnings).toEqual([]);
    expect(summary.added).toEqual({
      people: 2,
      ranks: 1,
      templates: 1,
      orbats: 1,
      aars: 1,
    });
  });

  it('lands ORBATs and AARs intact on a fresh machine', () => {
    // What the "Export ORBATs & AARs" menu item builds. Without the template
    // the ORBAT is dropped on arrival and its AAR is left pointing at nothing;
    // without the assigned people it arrives with every slot empty.
    const weapons: Template = { id: 't2', name: 'Weapons Squad', groups: [] };
    const spare: Person = { id: 'p3', name: 'Kestrel' };
    const needed = dependenciesOf([redwood], {
      templates: [squad, weapons],
      people: [nyx, vex, spare],
    });

    // Only what the ORBAT depends on — not the whole roster or template list.
    expect(needed.templates).toEqual([squad]);
    expect(needed.people).toEqual([nyx, vex]);

    const bundle = createExportBundle({
      people: needed.people,
      templates: needed.templates,
      orbats: [redwood],
      aars: [redwoodAAR],
    });

    const parsed = parseImportFile(JSON.stringify(bundle, null, 2));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const { written, summary } = importInto(empty(), parsed.bundle);
    expect(written.orbats).toEqual([redwood]);
    expect(written.aars).toEqual([redwoodAAR]);
    expect(summary.warnings).toEqual([]);
  });

  it('is a no-op when the same file is imported twice', () => {
    const bundle = bundleOf({
      people: [nyx, vex],
      ranks: [sergeant],
      templates: [squad],
      orbats: [redwood],
      aars: [redwoodAAR],
    });
    const first = importInto(empty(), bundle);
    const second = importInto(first.written, bundle);

    expect(second.written).toEqual(empty());
    expect(second.summary.added).toEqual({
      people: 0,
      ranks: 0,
      templates: 0,
      orbats: 0,
      aars: 0,
    });
  });
});
