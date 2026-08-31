import type { ORBAT, Person, Template } from '../types';

/**
 * Resolving an ORBAT against its template and personnel, and rendering the
 * result for each place it has to go.
 *
 * This used to be two half-implementations: clipboard.ts and aar.ts carried
 * byte-identical person/assignment lookups and had already drifted apart on
 * the question that matters — what to show when an assignment names someone
 * who is no longer on the roster. One rendered `[UNKNOWN]`, the other quietly
 * dropped the row. There is now one answer, decided here.
 */

// ---- The roster value --------------------------------------------------------

export interface RosterEntry {
  slotId: string;
  roleLabel: string;
  /** The assigned person, or null when the assignment outlived the record. */
  person: Person | null;
  /** How this person is named in every format. */
  display: string;
  equipment: string[];
  buddyTeam?: number;
}

export interface RosterGroup {
  name: string;
  entries: RosterEntry[];
}

export interface Roster {
  orbatName: string;
  /** Groups holding at least one assigned slot, in template order. */
  groups: RosterGroup[];
  /** Whether any assigned slot carries a buddy team. */
  hasBuddyTeams: boolean;
}

/**
 * Shown in place of a name when an assignment points at someone who is no
 * longer on the roster. Kept visible rather than dropped: a slot that was
 * filled is a fact about the operation, and silently losing the row from an
 * AAR loses that fact.
 */
export const UNKNOWN_PERSON = '[UNKNOWN]';

export function personDisplay(person: Person | null | undefined): string {
  if (!person) return UNKNOWN_PERSON;
  return person.rank ? `${person.rank} ${person.name}` : person.name;
}

export function resolveRoster(
  orbat: ORBAT,
  template: Template,
  people: Person[],
): Roster {
  const personById = new Map(people.map((p) => [p.id, p]));
  const assignmentBySlotId = new Map(
    orbat.assignments.map((a) => [a.slotId, a]),
  );
  const buddyTeamBySlotId = new Map(
    (orbat.buddyTeams ?? []).map((b) => [b.slotId, b.team]),
  );

  const groups: RosterGroup[] = [];
  let hasBuddyTeams = false;

  for (const group of template.groups) {
    const entries: RosterEntry[] = [];
    for (const slot of group.slots) {
      const assignment = assignmentBySlotId.get(slot.id);
      if (!assignment) continue;

      const person = personById.get(assignment.personId) ?? null;
      const buddyTeam = buddyTeamBySlotId.get(slot.id);
      if (buddyTeam != null) hasBuddyTeams = true;

      entries.push({
        slotId: slot.id,
        roleLabel: slot.roleLabel,
        person,
        display: personDisplay(person),
        equipment: slot.equipment ?? [],
        ...(buddyTeam != null && { buddyTeam }),
      });
    }
    if (entries.length > 0) groups.push({ name: group.name, entries });
  }

  return { orbatName: orbat.name, groups, hasBuddyTeams };
}

// ---- Shared formatting -------------------------------------------------------

function dateLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export interface RenderOptions {
  includeEquipment?: boolean;
  /** Injectable so rendered output can be asserted against a fixed date. */
  date?: Date;
}

/**
 * Width of the buddy-team column, including its trailing space. Team numbers
 * are 1-8, so `[BTn] ` is always this wide and the role and person columns
 * stay aligned in the monospace block.
 */
export const BUDDY_COLUMN_WIDTH = 6;

function buddyPrefix(team: number | undefined): string {
  return team ? `[BT${team}] ` : ' '.repeat(BUDDY_COLUMN_WIDTH);
}

/** The aligned block both the TeamSpeak and Discord targets are built on. */
function monospaceLines(roster: Roster, includeEquipment: boolean): string[] {
  const lines: string[] = [];

  for (const group of roster.groups) {
    lines.push('');
    lines.push(`--- ${group.name} ---`);

    const hasEquipment =
      includeEquipment && group.entries.some((e) => e.equipment.length > 0);
    const roleWidth = Math.max(...group.entries.map((e) => e.roleLabel.length));

    for (const entry of group.entries) {
      const role = entry.roleLabel.padEnd(roleWidth);
      const equipment =
        hasEquipment && entry.equipment.length > 0
          ? ` — ${entry.equipment.join(', ')}`
          : '';
      const indent = roster.hasBuddyTeams ? buddyPrefix(entry.buddyTeam) : '  ';
      lines.push(`${indent}${role}  ${entry.display}${equipment}`);
    }
  }

  return lines;
}

// ---- Targets -----------------------------------------------------------------

export function renderTeamspeak(
  roster: Roster,
  { includeEquipment = true, date = new Date() }: RenderOptions = {},
): string {
  const lines = ['', `=== ${roster.orbatName} (${dateLabel(date)}) ===`];
  lines.push(...monospaceLines(roster, includeEquipment));
  return lines.join('\n');
}

export function renderDiscord(
  roster: Roster,
  { includeEquipment = true, date = new Date() }: RenderOptions = {},
): string {
  const lines = [`**=== ${roster.orbatName} (${dateLabel(date)}) ===**`, '```'];
  lines.push(...monospaceLines(roster, includeEquipment));
  lines.push('```');
  return lines.join('\n');
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Every interpolated string in the AAR goes through here. The generated HTML
 * is handed to `innerHTML` downstream, and personnel names can arrive from an
 * import file, so an unescaped name is a script that runs.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export function renderAARHtml(
  roster: Roster,
  { date = new Date() }: RenderOptions = {},
): string {
  const parts: string[] = [];
  parts.push(
    `<h2>AAR — ${escapeHtml(roster.orbatName)} — ${dateLabel(date)}</h2>`,
  );

  for (const group of roster.groups) {
    parts.push(`<h3>${escapeHtml(group.name)}</h3>`);
    parts.push('<ul>');
    for (const entry of group.entries) {
      parts.push(
        `<li><p><strong>${escapeHtml(entry.roleLabel)}</strong>: ${escapeHtml(entry.display)}<br><br></p></li>`,
      );
    }
    parts.push('</ul>');
  }

  parts.push('<h2>Notes</h2>');
  parts.push('<p></p>');

  return parts.join('');
}

export function aarTitle(orbatName: string, date = new Date()): string {
  return `AAR — ${orbatName} — ${dateLabel(date)}`;
}

// ---- Plain text --------------------------------------------------------------

function elementToText(el: Element): string {
  // Replace <br> with newlines before extracting text
  const clone = el.cloneNode(true) as Element;
  for (const br of clone.querySelectorAll('br')) {
    br.replaceWith('\n');
  }
  return clone.textContent?.trim() ?? '';
}

/**
 * The fourth target: an AAR the user has since edited, flattened for pasting.
 * Unlike the others its input is the edited document rather than the roster,
 * and it is the one renderer that needs a DOM.
 */
export function aarHtmlToPlainText(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  const lines: string[] = [];

  for (const node of tmp.childNodes) {
    if (!(node instanceof HTMLElement)) {
      const text = node.textContent?.trim();
      if (text) lines.push(text);
      continue;
    }

    const tag = node.tagName;

    if (tag === 'H2' || tag === 'H3') {
      if (lines.length > 0) lines.push('');
      lines.push(node.textContent?.trim() ?? '');
    } else if (tag === 'UL' || tag === 'OL') {
      for (const li of node.querySelectorAll('li')) {
        const text = elementToText(li);
        if (!text) continue;
        const liLines = text.split('\n').filter((l) => l.trim());
        lines.push(`  - ${liLines[0]}`);
        for (let i = 1; i < liLines.length; i++) {
          lines.push(`    ${liLines[i]}`);
        }
      }
    } else if (tag === 'P') {
      const text = elementToText(node);
      if (text) lines.push(text);
    }
  }

  return lines.join('\n');
}
