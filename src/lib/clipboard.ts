import type { Assignment, ORBAT, Person, Template } from '../types';

function buildPersonMap(people: Person[]): Map<string, Person> {
  return new Map(people.map((p) => [p.id, p]));
}

function buildAssignmentMap(
  assignments: Assignment[],
): Map<string, Assignment> {
  return new Map(assignments.map((a) => [a.slotId, a]));
}

function getPersonDisplay(
  personId: string,
  personMap: Map<string, Person>,
): string {
  const person = personMap.get(personId);
  if (!person) return '[UNKNOWN]';
  return person.rank ? `${person.rank} ${person.name}` : person.name;
}

// Fixed-width buddy-team column: `[BTn] ` when the slot has a team, or an
// equal-width blank so role/person columns stay aligned in the monospace block.
// Team numbers are 1-8 (single digit), so this is always 6 characters.
function buddyTeamPrefix(team: number | undefined): string {
  return team ? `[BT${team}] ` : '      ';
}

interface FormatOptions {
  orbat: ORBAT;
  template: Template;
  people: Person[];
  includeEquipment: boolean;
}

function formatGroupLines({
  orbat,
  template,
  people,
  includeEquipment,
}: FormatOptions): string[] {
  const personMap = buildPersonMap(people);
  const assignmentMap = buildAssignmentMap(orbat.assignments);
  const buddyTeamBySlotId = new Map(
    (orbat.buddyTeams ?? []).map((b) => [b.slotId, b.team]),
  );
  // Only render the buddy-team column when at least one assigned (copied) slot
  // actually has a team — otherwise leave output identical to the no-teams case.
  const hasBuddyTeams = template.groups.some((group) =>
    group.slots.some(
      (s) => assignmentMap.has(s.id) && buddyTeamBySlotId.has(s.id),
    ),
  );
  const lines: string[] = [];

  for (const group of template.groups) {
    const assignedSlots = group.slots.filter((s) => assignmentMap.has(s.id));

    if (assignedSlots.length === 0) continue;

    lines.push('');
    lines.push(`--- ${group.name} ---`);
    const hasEquipment =
      includeEquipment && assignedSlots.some((s) => s.equipment?.length);
    const maxRole = Math.max(...assignedSlots.map((s) => s.roleLabel.length));
    for (const slot of assignedSlots) {
      const assignment = assignmentMap.get(slot.id);
      if (!assignment) continue;
      const personDisplay = getPersonDisplay(assignment.personId, personMap);
      const role = slot.roleLabel.padEnd(maxRole);
      const equipStr =
        hasEquipment && slot.equipment?.length
          ? ` — ${slot.equipment.join(', ')}`
          : '';
      const indent = hasBuddyTeams
        ? buddyTeamPrefix(buddyTeamBySlotId.get(slot.id))
        : '  ';
      lines.push(`${indent}${role}  ${personDisplay}${equipStr}`);
    }
  }

  return lines;
}

function formatDateHeader(name: string): string {
  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return `${name} (${today})`;
}

export function formatOrbatForTeamspeak(
  orbat: ORBAT,
  template: Template,
  people: Person[],
  includeEquipment = true,
): string {
  const lines: string[] = [];
  lines.push('', `=== ${formatDateHeader(orbat.name)} ===`);
  lines.push(
    ...formatGroupLines({ orbat, template, people, includeEquipment }),
  );
  return lines.join('\n');
}

export function formatOrbatForDiscord(
  orbat: ORBAT,
  template: Template,
  people: Person[],
  includeEquipment = true,
): string {
  const lines: string[] = [];
  lines.push(`**=== ${formatDateHeader(orbat.name)} ===**`);
  lines.push('```');
  lines.push(
    ...formatGroupLines({ orbat, template, people, includeEquipment }),
  );
  lines.push('```');
  return lines.join('\n');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
