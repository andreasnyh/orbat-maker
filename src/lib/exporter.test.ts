import { describe, expect, it } from 'vitest';
import type { ORBAT, Person, Template } from '../types';
import {
  aarTitle,
  BUDDY_COLUMN_WIDTH,
  escapeHtml,
  personDisplay,
  renderAARHtml,
  renderDiscord,
  renderTeamspeak,
  resolveRoster,
  UNKNOWN_PERSON,
} from './exporter';

// ---- Fixtures ----------------------------------------------------------------

const nyx: Person = { id: 'p1', name: 'Nyx', rank: 'SGT' };
const vex: Person = { id: 'p2', name: 'Vex' };
const kilo: Person = { id: 'p3', name: 'Kilo', rank: 'CPL' };

const template: Template = {
  id: 't1',
  name: 'Rifle Squad',
  groups: [
    {
      id: 'g1',
      name: 'Alpha',
      slots: [
        { id: 's1', roleLabel: 'Team Leader' },
        { id: 's2', roleLabel: 'Rifleman', equipment: ['M4', 'Smoke'] },
        { id: 's3', roleLabel: 'Medic' },
      ],
    },
    { id: 'g2', name: 'Bravo', slots: [{ id: 's4', roleLabel: 'Grenadier' }] },
    { id: 'g3', name: 'Empty', slots: [{ id: 's5', roleLabel: 'Spare' }] },
  ],
};

const orbat: ORBAT = {
  id: 'o1',
  name: 'Op Redwood',
  templateId: 't1',
  assignments: [
    { slotId: 's1', personId: 'p1' },
    { slotId: 's2', personId: 'p2' },
    { slotId: 's4', personId: 'p3' },
  ],
};

const people = [nyx, vex, kilo];

// Fixed so rendered output can be asserted exactly. The stamp itself is
// locale-dependent, so it is derived the same way the renderers derive it.
const DATE = new Date('2026-08-31T12:00:00Z');
const STAMP = DATE.toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

// ---- Resolution --------------------------------------------------------------

describe('resolveRoster', () => {
  it('keeps assigned slots in template order and drops empty groups', () => {
    const roster = resolveRoster(orbat, template, people);
    expect(roster.orbatName).toBe('Op Redwood');
    expect(roster.groups.map((g) => g.name)).toEqual(['Alpha', 'Bravo']);
    expect(roster.groups[0].entries.map((e) => e.roleLabel)).toEqual([
      'Team Leader',
      'Rifleman',
    ]);
    expect(roster.groups[0].entries[0].person).toBe(nyx);
    expect(roster.groups[0].entries[0].display).toBe('SGT Nyx');
    expect(roster.groups[0].entries[1].display).toBe('Vex');
    expect(roster.hasBuddyTeams).toBe(false);
  });

  it('reports buddy teams only when an assigned slot has one', () => {
    const unassignedTeam: ORBAT = {
      ...orbat,
      buddyTeams: [{ slotId: 's5', team: 1 }],
    };
    expect(resolveRoster(unassignedTeam, template, people).hasBuddyTeams).toBe(
      false,
    );

    const assignedTeam: ORBAT = {
      ...orbat,
      buddyTeams: [{ slotId: 's1', team: 2 }],
    };
    const roster = resolveRoster(assignedTeam, template, people);
    expect(roster.hasBuddyTeams).toBe(true);
    expect(roster.groups[0].entries[0].buddyTeam).toBe(2);
  });

  it('keeps a slot whose person is gone, rather than dropping it', () => {
    // aar.ts used to `continue` here, silently losing the row; clipboard.ts
    // rendered [UNKNOWN]. One rule now, and it is the one that keeps the fact
    // that the slot was filled.
    const orphan: ORBAT = {
      ...orbat,
      assignments: [{ slotId: 's1', personId: 'deleted' }],
    };
    const roster = resolveRoster(orphan, template, people);
    expect(roster.groups[0].entries).toHaveLength(1);
    expect(roster.groups[0].entries[0].person).toBeNull();
    expect(roster.groups[0].entries[0].display).toBe(UNKNOWN_PERSON);
  });
});

describe('personDisplay', () => {
  it('prefixes the rank when there is one', () => {
    expect(personDisplay(nyx)).toBe('SGT Nyx');
    expect(personDisplay(vex)).toBe('Vex');
    expect(personDisplay(null)).toBe(UNKNOWN_PERSON);
    expect(personDisplay(undefined)).toBe(UNKNOWN_PERSON);
  });
});

// ---- Monospace targets -------------------------------------------------------

describe('renderTeamspeak', () => {
  it('renders the aligned block', () => {
    const roster = resolveRoster(orbat, template, people);
    expect(renderTeamspeak(roster, { date: DATE })).toBe(
      [
        '',
        `=== Op Redwood (${STAMP}) ===`,
        '',
        '--- Alpha ---',
        '  Team Leader  SGT Nyx',
        '  Rifleman     Vex — M4, Smoke',
        '',
        '--- Bravo ---',
        '  Grenadier  CPL Kilo',
      ].join('\n'),
    );
  });

  it('drops the equipment column when it is turned off', () => {
    const roster = resolveRoster(orbat, template, people);
    const text = renderTeamspeak(roster, {
      date: DATE,
      includeEquipment: false,
    });
    expect(text).not.toContain('M4');
    expect(text).toContain('  Rifleman     Vex');
  });
});

describe('renderDiscord', () => {
  it('wraps the same block in a code fence', () => {
    const roster = resolveRoster(orbat, template, people);
    const lines = renderDiscord(roster, { date: DATE }).split('\n');
    expect(lines[0]).toBe(`**=== Op Redwood (${STAMP}) ===**`);
    expect(lines[1]).toBe('```');
    expect(lines.at(-1)).toBe('```');
    expect(lines).toContain('  Team Leader  SGT Nyx');
  });
});

describe('column alignment', () => {
  it('pads every role to the longest in its own group', () => {
    const roster = resolveRoster(orbat, template, people);
    const lines = renderTeamspeak(roster, { date: DATE }).split('\n');
    const nyxLine = lines.find((l) => l.includes('SGT Nyx')) ?? '';
    const vexLine = lines.find((l) => l.includes('Vex')) ?? '';
    // 'Team Leader' is the longest role in Alpha, so the person column starts
    // at the same index on both of its lines.
    expect(nyxLine.indexOf('SGT Nyx')).toBe(vexLine.indexOf('Vex'));
    expect(nyxLine.indexOf('SGT Nyx')).toBe('  Team Leader  '.length);
    // Bravo is padded independently, against its own longest role.
    expect(lines).toContain('  Grenadier  CPL Kilo');
  });

  it('holds the buddy-team column to a fixed width', () => {
    const withTeams: ORBAT = {
      ...orbat,
      buddyTeams: [{ slotId: 's1', team: 1 }],
    };
    const roster = resolveRoster(withTeams, template, people);
    const lines = renderTeamspeak(roster, { date: DATE }).split('\n');

    const teamed = lines.find((l) => l.includes('SGT Nyx')) ?? '';
    const unteamed = lines.find((l) => l.includes('Vex')) ?? '';
    expect(teamed.startsWith('[BT1] ')).toBe(true);
    expect(unteamed.startsWith(' '.repeat(BUDDY_COLUMN_WIDTH))).toBe(true);
    // Same prefix width means the role column still lines up.
    expect(teamed.indexOf('Team Leader')).toBe(BUDDY_COLUMN_WIDTH);
    expect(unteamed.indexOf('Rifleman')).toBe(BUDDY_COLUMN_WIDTH);
  });
});

// ---- AAR HTML ----------------------------------------------------------------

describe('renderAARHtml', () => {
  it('renders a heading and a list per group', () => {
    const roster = resolveRoster(orbat, template, people);
    expect(renderAARHtml(roster, { date: DATE })).toBe(
      `<h2>AAR — Op Redwood — ${STAMP}</h2>` +
        '<h3>Alpha</h3>' +
        '<ul>' +
        '<li><p><strong>Team Leader</strong>: SGT Nyx<br><br></p></li>' +
        '<li><p><strong>Rifleman</strong>: Vex<br><br></p></li>' +
        '</ul>' +
        '<h3>Bravo</h3>' +
        '<ul>' +
        '<li><p><strong>Grenadier</strong>: CPL Kilo<br><br></p></li>' +
        '</ul>' +
        '<h2>Notes</h2>' +
        '<p></p>',
    );
  });

  it('escapes every interpolated string', () => {
    // This HTML reaches innerHTML, and a person can arrive from an import
    // file, so an unescaped name is a script that runs.
    const attacker: Person = { id: 'p9', name: '<img src=x onerror=alert(1)>' };
    const hostile: Template = {
      ...template,
      groups: [
        {
          id: 'g1',
          name: 'A & B',
          slots: [{ id: 's1', roleLabel: '"Point" <man>' }],
        },
      ],
    };
    const html = renderAARHtml(
      resolveRoster(
        {
          ...orbat,
          name: "Op <script>alert('x')</script>",
          assignments: [{ slotId: 's1', personId: 'p9' }],
        },
        hostile,
        [attacker],
      ),
      { date: DATE },
    );

    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('<h3>A &amp; B</h3>');
    expect(html).toContain('&quot;Point&quot; &lt;man&gt;');
  });

  it('names an unresolved person instead of omitting the row', () => {
    const orphan: ORBAT = {
      ...orbat,
      assignments: [{ slotId: 's1', personId: 'deleted' }],
    };
    const html = renderAARHtml(resolveRoster(orphan, template, people), {
      date: DATE,
    });
    expect(html).toContain(
      `<strong>Team Leader</strong>: ${escapeHtml(UNKNOWN_PERSON)}`,
    );
  });
});

describe('escapeHtml', () => {
  it('covers the five characters that break out of markup', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
    expect(escapeHtml('nothing to do')).toBe('nothing to do');
  });
});

describe('aarTitle', () => {
  it('names the ORBAT and the date', () => {
    expect(aarTitle('Op Redwood', DATE)).toBe(`AAR — Op Redwood — ${STAMP}`);
  });
});
