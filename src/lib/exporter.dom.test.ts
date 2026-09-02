/**
 * @vitest-environment happy-dom
 *
 * `aarHtmlToPlainText` is the one export in this module that needs a DOM, so
 * it is tested apart from the pure renderers in exporter.test.ts rather than
 * putting the whole suite behind a browser environment.
 */
import { describe, expect, it } from 'vitest';
import type { ORBAT, Person, Template } from '../types';
import { aarHtmlToPlainText, renderAARHtml, resolveRoster } from './exporter';

const DATE = new Date('2026-08-31T12:00:00Z');
const STAMP = DATE.toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

describe('aarHtmlToPlainText', () => {
  it('flattens a freshly generated AAR', () => {
    const template: Template = {
      id: 't1',
      name: 'Rifle Squad',
      groups: [
        {
          id: 'g1',
          name: 'Alpha',
          slots: [
            { id: 's1', roleLabel: 'Team Leader' },
            { id: 's2', roleLabel: 'Rifleman' },
          ],
        },
        {
          id: 'g2',
          name: 'Bravo',
          slots: [{ id: 's3', roleLabel: 'Grenadier' }],
        },
      ],
    };
    const orbat: ORBAT = {
      id: 'o1',
      name: 'Op Redwood',
      templateId: 't1',
      assignments: [
        { slotId: 's1', personId: 'p1' },
        { slotId: 's2', personId: 'p2' },
        { slotId: 's3', personId: 'p3' },
      ],
    };
    const people: Person[] = [
      { id: 'p1', name: 'Nyx', rank: 'SGT' },
      { id: 'p2', name: 'Vex' },
      { id: 'p3', name: 'Kilo', rank: 'CPL' },
    ];

    const html = renderAARHtml(resolveRoster(orbat, template, people), {
      date: DATE,
    });

    expect(aarHtmlToPlainText(html)).toBe(
      [
        `AAR — Op Redwood — ${STAMP}`,
        '',
        'Alpha',
        '  - Team Leader: SGT Nyx',
        '  - Rifleman: Vex',
        '',
        'Bravo',
        '  - Grenadier: CPL Kilo',
        '',
        'Notes',
      ].join('\n'),
    );
  });

  it('decodes the entities renderAARHtml escaped, without running them', () => {
    // The two halves have to agree: renderAARHtml escapes on the way out, and
    // the innerHTML parse here decodes on the way back, so a hostile name
    // survives as literal text rather than as markup.
    const hostile = '<img src=x onerror=alert(1)> & "friends"';
    const template: Template = {
      id: 't1',
      name: 'T',
      groups: [
        { id: 'g1', name: 'A & B', slots: [{ id: 's1', roleLabel: 'Lead' }] },
      ],
    };
    const orbat: ORBAT = {
      id: 'o1',
      name: 'Op',
      templateId: 't1',
      assignments: [{ slotId: 's1', personId: 'p1' }],
    };

    const html = renderAARHtml(
      resolveRoster(orbat, template, [{ id: 'p1', name: hostile }]),
      { date: DATE },
    );
    const text = aarHtmlToPlainText(html);

    expect(text).toContain(`Lead: ${hostile}`);
    expect(text).toContain('A & B');
  });

  it('keeps blocks the toolbar has no button for', () => {
    // StarterKit leaves blockquote and code-block input rules on, so `> ` and
    // ``` produce nodes the flattener used to walk straight past.
    const text = aarHtmlToPlainText(
      '<p>Before</p>' +
        '<blockquote><p>Contact at the treeline</p></blockquote>' +
        '<pre><code>net: 40.100</code></pre>' +
        '<hr>' +
        '<p>After</p>',
    );

    expect(text).toBe(
      ['Before', 'Contact at the treeline', 'net: 40.100', 'After'].join('\n'),
    );
  });

  it('indents a nested list instead of emitting it twice', () => {
    const text = aarHtmlToPlainText(
      '<ul>' +
        '<li><p>Phase one</p><ul><li><p>Cross the LD</p></li></ul></li>' +
        '<li><p>Phase two</p></li>' +
        '</ul>',
    );

    expect(text).toBe(
      ['  - Phase one', '    - Cross the LD', '  - Phase two'].join('\n'),
    );
  });

  it('turns line breaks inside an item into indented continuations', () => {
    expect(
      aarHtmlToPlainText('<ul><li><p>Role: Name<br>Note here</p></li></ul>'),
    ).toBe(['  - Role: Name', '    Note here'].join('\n'));
  });

  it('separates headings with a blank line but never leads with one', () => {
    expect(aarHtmlToPlainText('<h2>First</h2><p>Body</p><h3>Second</h3>')).toBe(
      ['First', 'Body', '', 'Second'].join('\n'),
    );
  });

  it('handles an empty document and bare text', () => {
    expect(aarHtmlToPlainText('')).toBe('');
    expect(aarHtmlToPlainText('<p></p>')).toBe('');
    expect(aarHtmlToPlainText('loose text')).toBe('loose text');
  });
});
