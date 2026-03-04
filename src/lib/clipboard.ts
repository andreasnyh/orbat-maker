import type { ORBAT, Person, Template } from '../types';

function buildPersonMap(people: Person[]): Map<string, Person> {
  return new Map(people.map((p) => [p.id, p]));
}

function getPersonDisplay(
  personId: string,
  personMap: Map<string, Person>,
): string {
  const person = personMap.get(personId);
  if (!person) return '[UNKNOWN]';
  return person.rank ? `${person.rank} ${person.name}` : person.name;
}

function padRight(str: string, len: number): string {
  return str + ' '.repeat(Math.max(0, len - str.length));
}

export function formatOrbatForTeamspeak(
  orbat: ORBAT,
  template: Template,
  people: Person[],
): string {
  const personMap = buildPersonMap(people);
  const lines: string[] = [];
  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const header = `=== ${orbat.name} (${today}) ===`;
  lines.push(header);

  for (const group of template.groups) {
    const assignedSlots = group.slots.filter((s) =>
      orbat.assignments.some((a) => a.slotId === s.id),
    );

    if (assignedSlots.length === 0) continue;

    lines.push('');
    lines.push(`--- ${group.name} ---`);

    // Find max role label length for alignment padding
    const maxLen = Math.max(...assignedSlots.map((s) => s.roleLabel.length));

    for (const slot of assignedSlots) {
      const assignment = orbat.assignments.find((a) => a.slotId === slot.id);
      if (!assignment) continue;
      const personDisplay = getPersonDisplay(assignment.personId, personMap);
      const equipStr = slot.equipment?.length
        ? ` — ${slot.equipment.join(', ')}`
        : '';
      lines.push(
        `  ${padRight(`${slot.roleLabel}:`, maxLen + 1)}  ${personDisplay}${equipStr}`,
      );
    }
  }

  return lines.join('\n');
}

export function formatOrbatForDiscord(
  orbat: ORBAT,
  template: Template,
  people: Person[],
): string {
  const personMap = buildPersonMap(people);
  const lines: string[] = [];
  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const header = `**=== ${orbat.name} (${today}) ===**`;
  lines.push(header);

  for (const group of template.groups) {
    const assignedSlots = group.slots.filter((s) =>
      orbat.assignments.some((a) => a.slotId === s.id),
    );

    if (assignedSlots.length === 0) continue;

    lines.push('');
    lines.push(`**--- ${group.name} ---**`);

    for (const slot of assignedSlots) {
      const assignment = orbat.assignments.find((a) => a.slotId === slot.id);
      if (!assignment) continue;
      const personDisplay = getPersonDisplay(assignment.personId, personMap);
      const equipStr = slot.equipment?.length
        ? ` — ${slot.equipment.join(', ')}`
        : '';
      lines.push(`\`${slot.roleLabel}\`  ${personDisplay}${equipStr}`);
    }
  }

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
