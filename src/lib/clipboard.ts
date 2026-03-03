import type { ORBAT, Template, Person } from '../types'

function getPersonDisplay(personId: string, people: Person[]): string {
  const person = people.find(p => p.id === personId)
  if (!person) return '[UNKNOWN]'
  return person.rank ? `${person.rank} ${person.name}` : person.name
}

function padRight(str: string, len: number): string {
  return str + ' '.repeat(Math.max(0, len - str.length))
}

export function formatOrbatForTeamspeak(
  orbat: ORBAT,
  template: Template,
  people: Person[],
): string {
  const lines: string[] = []
  const header = orbat.date
    ? `=== ${orbat.name} (${orbat.date}) ===`
    : `=== ${orbat.name} ===`
  lines.push(header)

  for (const group of template.groups) {
    lines.push('')
    lines.push(`--- ${group.name} ---`)

    // Find max role label length for alignment padding
    const maxLen = Math.max(...group.slots.map(s => s.roleLabel.length))

    for (const slot of group.slots) {
      const assignment = orbat.assignments.find(a => a.slotId === slot.id)
      const personDisplay = assignment
        ? getPersonDisplay(assignment.personId, people)
        : '[EMPTY]'
      lines.push(`  ${padRight(slot.roleLabel + ':', maxLen + 1)}  ${personDisplay}`)
    }
  }

  return lines.join('\n')
}

export function formatOrbatForDiscord(
  orbat: ORBAT,
  template: Template,
  people: Person[],
): string {
  const lines: string[] = []
  const header = orbat.date
    ? `**=== ${orbat.name} (${orbat.date}) ===**`
    : `**=== ${orbat.name} ===**`
  lines.push(header)

  for (const group of template.groups) {
    lines.push('')
    lines.push(`**--- ${group.name} ---**`)

    for (const slot of group.slots) {
      const assignment = orbat.assignments.find(a => a.slotId === slot.id)
      const personDisplay = assignment
        ? getPersonDisplay(assignment.personId, people)
        : '*[EMPTY]*'
      lines.push(`\`${slot.roleLabel}\`  ${personDisplay}`)
    }
  }

  return lines.join('\n')
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
