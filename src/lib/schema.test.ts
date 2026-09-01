import { describe, expect, it } from 'vitest';
import {
  sanitizeAAR,
  sanitizeCollection,
  sanitizeOrbat,
  sanitizePerson,
  sanitizeTemplate,
} from './schema';

describe('sanitizePerson', () => {
  it('accepts a well-formed person', () => {
    expect(sanitizePerson({ id: 'p1', name: 'Nyx', rank: 'SGT' })).toEqual({
      id: 'p1',
      name: 'Nyx',
      rank: 'SGT',
    });
  });

  it('rejects records that would crash a render', () => {
    // p.name.toLowerCase() is called on every roster render.
    expect(sanitizePerson({ id: 'p1' })).toBeNull();
    expect(sanitizePerson({ id: 'p1', name: '' })).toBeNull();
    expect(sanitizePerson({ id: 'p1', name: '   ' })).toBeNull();
    expect(sanitizePerson({ id: 'p1', name: 42 })).toBeNull();
    expect(sanitizePerson({ name: 'No id' })).toBeNull();
    expect(sanitizePerson(null)).toBeNull();
    expect(sanitizePerson('Nyx')).toBeNull();
    expect(sanitizePerson([{ id: 'p1', name: 'Nyx' }])).toBeNull();
  });

  it('keeps only known fields', () => {
    // Parsed rather than written as a literal: JSON.parse gives __proto__ as
    // an own property, which is exactly what an import file can carry.
    const person = sanitizePerson(
      JSON.parse(
        '{"id":"p1","name":"Nyx","admin":true,"__proto__":{"polluted":true}}',
      ),
    );
    expect(person).toEqual({ id: 'p1', name: 'Nyx' });
    expect(Object.keys(person ?? {})).toEqual(['id', 'name']);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('drops a non-string rank rather than carrying it through', () => {
    expect(sanitizePerson({ id: 'p1', name: 'Nyx', rank: 7 })).toEqual({
      id: 'p1',
      name: 'Nyx',
    });
  });
});

describe('sanitizeTemplate', () => {
  it('keeps the valid groups and slots and drops the rest', () => {
    expect(
      sanitizeTemplate({
        id: 't1',
        name: 'Squad',
        groups: [
          {
            id: 'g1',
            name: 'Alpha',
            color: 'red',
            slots: [
              { id: 's1', roleLabel: 'SL', equipment: ['radio', 9] },
              { id: 's2' },
              { id: 's1', roleLabel: 'duplicate id' },
              'not a slot',
            ],
          },
          { id: 'g2', slots: [] },
          null,
        ],
      }),
    ).toEqual({
      id: 't1',
      name: 'Squad',
      groups: [
        {
          id: 'g1',
          name: 'Alpha',
          color: 'red',
          slots: [{ id: 's1', roleLabel: 'SL', equipment: ['radio'] }],
        },
      ],
    });
  });

  it('treats a missing groups array as no groups', () => {
    expect(sanitizeTemplate({ id: 't1', name: 'Squad' })).toEqual({
      id: 't1',
      name: 'Squad',
      groups: [],
    });
  });
});

describe('sanitizeOrbat', () => {
  it('holds one person per slot and one slot per person', () => {
    const orbat = sanitizeOrbat({
      id: 'o1',
      name: 'Op Redwood',
      templateId: 't1',
      assignments: [
        { slotId: 's1', personId: 'p1' },
        { slotId: 's1', personId: 'p2' },
        { slotId: 's2', personId: 'p1' },
        { slotId: 's2', personId: 'p2' },
        { slotId: 's3' },
      ],
      buddyTeams: [
        { slotId: 's1', team: 1 },
        { slotId: 's1', team: 2 },
        { slotId: 's2', team: 'red' },
      ],
    });
    expect(orbat?.assignments).toEqual([
      { slotId: 's1', personId: 'p1' },
      { slotId: 's2', personId: 'p2' },
    ]);
    expect(orbat?.buddyTeams).toEqual([{ slotId: 's1', team: 1 }]);
  });

  it('rejects an ORBAT with no template to render against', () => {
    expect(
      sanitizeOrbat({ id: 'o1', name: 'Op Redwood', assignments: [] }),
    ).toBeNull();
  });

  it('keeps only whole, 1-based buddy team numbers', () => {
    // teamColor indexes the palette by (team - 1) % length, so a fraction
    // reads off the end of the array and yields no color at all.
    const orbat = sanitizeOrbat({
      id: 'o1',
      name: 'Op Redwood',
      templateId: 't1',
      assignments: [],
      buddyTeams: [
        { slotId: 's1', team: 2.5 },
        { slotId: 's2', team: 0 },
        { slotId: 's3', team: -1 },
        { slotId: 's4', team: Number.NaN },
        { slotId: 's5', team: 12 },
      ],
    });
    // 12 is past the picker's range but still cycles to a real color.
    expect(orbat?.buddyTeams).toEqual([{ slotId: 's5', team: 12 }]);
  });
});

describe('sanitizeAAR', () => {
  it('requires the timestamps the list sorts by', () => {
    const base = {
      id: 'a1',
      orbatId: 'o1',
      title: 'AAR',
      content: '<p>x</p>',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };
    expect(sanitizeAAR(base)).toEqual(base);
    expect(sanitizeAAR({ ...base, updatedAt: undefined })).toBeNull();
    expect(sanitizeAAR({ ...base, content: null })).toBeNull();
    // An empty title is a real state the editor allows.
    expect(sanitizeAAR({ ...base, title: '' })?.title).toBe('');
  });
});

describe('sanitizeCollection', () => {
  it('counts what it drops and keeps the first of each id', () => {
    const result = sanitizeCollection(
      [
        { id: 'p1', name: 'Nyx' },
        { id: 'p1', name: 'Nyx again' },
        { id: 'p2' },
        'garbage',
        { id: 'p3', name: 'Vex' },
      ],
      sanitizePerson,
    );
    expect(result.valid).toEqual([
      { id: 'p1', name: 'Nyx' },
      { id: 'p3', name: 'Vex' },
    ]);
    expect(result.rejected).toBe(3);
  });

  it('reads a missing section as empty and a malformed one as rejected', () => {
    expect(sanitizeCollection(undefined, sanitizePerson)).toEqual({
      valid: [],
      rejected: 0,
    });
    expect(sanitizeCollection({ p1: 'Nyx' }, sanitizePerson)).toEqual({
      valid: [],
      rejected: 1,
    });
  });
});
