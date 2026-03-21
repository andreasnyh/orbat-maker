import type { Assignment, ORBAT, Person, Template } from '../types';

function buildPersonMap(people: Person[]): Map<string, Person> {
  return new Map(people.map((p) => [p.id, p]));
}

function buildAssignmentMap(
  assignments: Assignment[],
): Map<string, Assignment> {
  return new Map(assignments.map((a) => [a.slotId, a]));
}

function getPersonDisplay(person: Person): string {
  return person.rank ? `${person.rank} ${person.name}` : person.name;
}

export function generateAARContent(
  orbat: ORBAT,
  template: Template,
  people: Person[],
): string {
  const personMap = buildPersonMap(people);
  const assignmentMap = buildAssignmentMap(orbat.assignments);

  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const parts: string[] = [];
  parts.push(`<h2>AAR — ${orbat.name} — ${today}</h2>`);

  for (const group of template.groups) {
    const assignedSlots = group.slots.filter((s) => assignmentMap.has(s.id));
    if (assignedSlots.length === 0) continue;

    parts.push(`<h3>${group.name}</h3>`);
    parts.push('<ul>');
    for (const slot of assignedSlots) {
      const assignment = assignmentMap.get(slot.id);
      if (!assignment) continue;
      const person = personMap.get(assignment.personId);
      if (!person) continue;
      parts.push(
        `<li><p><strong>${slot.roleLabel}</strong>: ${getPersonDisplay(person)}<br><br class="ProseMirror-trailingBreak"></p></li>`,
      );
    }
    parts.push('</ul>');
  }

  parts.push('<h2>Notes</h2>');
  parts.push('<p></p>');

  return parts.join('');
}

function elementToText(el: Element): string {
  // Replace <br> with newlines before extracting text
  const clone = el.cloneNode(true) as Element;
  for (const br of clone.querySelectorAll('br')) {
    br.replaceWith('\n');
  }
  return clone.textContent?.trim() ?? '';
}

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

export function generateAARTitle(orbatName: string): string {
  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return `AAR — ${orbatName} — ${today}`;
}
