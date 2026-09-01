import type {
  AAR,
  Assignment,
  Group,
  ORBAT,
  Person,
  Rank,
  Slot,
  SlotBuddyTeam,
  Template,
} from '../types';

/**
 * Record sanitizers for untrusted data (import files, and eventually
 * localStorage payloads).
 *
 * Every sanitizer builds a *fresh* object from explicitly picked fields, so
 * unknown keys — including `__proto__` — never reach application state. A
 * record that cannot be made valid is rejected outright rather than repaired,
 * because a half-valid record crashes later, far from here.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A required identifier or label: a string with at least one visible char. */
function requiredString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

/** An optional string field: absent, or a string (any content). */
function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((v): v is string => typeof v === 'string');
  return items.length > 0 ? items : undefined;
}

/** Sanitize every element of an unknown value, dropping the ones that fail. */
function mapValid<T>(
  value: unknown,
  sanitize: (item: unknown) => T | null,
): T[] {
  if (!Array.isArray(value)) return [];
  const valid: T[] = [];
  for (const item of value) {
    const record = sanitize(item);
    if (record) valid.push(record);
  }
  return valid;
}

export function sanitizeRank(value: unknown): Rank | null {
  if (!isRecord(value)) return null;
  const id = requiredString(value.id);
  const name = requiredString(value.name);
  if (!id || !name) return null;
  return { id, name };
}

export function sanitizePerson(value: unknown): Person | null {
  if (!isRecord(value)) return null;
  const id = requiredString(value.id);
  const name = requiredString(value.name);
  if (!id || !name) return null;
  const person: Person = { id, name };
  const rank = optionalString(value.rank);
  if (rank !== undefined) person.rank = rank;
  return person;
}

export function sanitizeSlot(value: unknown): Slot | null {
  if (!isRecord(value)) return null;
  const id = requiredString(value.id);
  if (!id || typeof value.roleLabel !== 'string') return null;
  const slot: Slot = { id, roleLabel: value.roleLabel };
  const equipment = stringArray(value.equipment);
  if (equipment) slot.equipment = equipment;
  return slot;
}

export function sanitizeGroup(value: unknown): Group | null {
  if (!isRecord(value)) return null;
  const id = requiredString(value.id);
  const name = requiredString(value.name);
  if (!id || !name) return null;
  const group: Group = {
    id,
    name,
    slots: sanitizeCollection(value.slots, sanitizeSlot).valid,
  };
  const color = optionalString(value.color);
  if (color !== undefined) group.color = color;
  return group;
}

export function sanitizeTemplate(value: unknown): Template | null {
  if (!isRecord(value)) return null;
  const id = requiredString(value.id);
  const name = requiredString(value.name);
  if (!id || !name) return null;
  const template: Template = {
    id,
    name,
    groups: sanitizeCollection(value.groups, sanitizeGroup).valid,
  };
  const description = optionalString(value.description);
  if (description !== undefined) template.description = description;
  if (typeof value.isDefault === 'boolean')
    template.isDefault = value.isDefault;
  return template;
}

function sanitizeAssignment(value: unknown): Assignment | null {
  if (!isRecord(value)) return null;
  const slotId = requiredString(value.slotId);
  const personId = requiredString(value.personId);
  if (!slotId || !personId) return null;
  return { slotId, personId };
}

/**
 * Team numbers are 1-based whole numbers. There is no upper bound: `teamColor`
 * cycles the palette, so a number past the picker's range still reads
 * consistently. A fraction would not — it indexes the palette off the end.
 */
function sanitizeBuddyTeam(value: unknown): SlotBuddyTeam | null {
  if (!isRecord(value)) return null;
  const slotId = requiredString(value.slotId);
  const team = value.team;
  if (
    !slotId ||
    typeof team !== 'number' ||
    !Number.isInteger(team) ||
    team < 1
  )
    return null;
  return { slotId, team };
}

/** One person per slot, one slot per person — what assignPersonToSlot keeps. */
function dedupeAssignments(assignments: Assignment[]): Assignment[] {
  const slots = new Set<string>();
  const people = new Set<string>();
  return assignments.filter((a) => {
    if (slots.has(a.slotId) || people.has(a.personId)) return false;
    slots.add(a.slotId);
    people.add(a.personId);
    return true;
  });
}

function dedupeBuddyTeams(teams: SlotBuddyTeam[]): SlotBuddyTeam[] {
  const slots = new Set<string>();
  return teams.filter((t) => {
    if (slots.has(t.slotId)) return false;
    slots.add(t.slotId);
    return true;
  });
}

export function sanitizeOrbat(value: unknown): ORBAT | null {
  if (!isRecord(value)) return null;
  const id = requiredString(value.id);
  const name = requiredString(value.name);
  const templateId = requiredString(value.templateId);
  if (!id || !name || !templateId) return null;
  const orbat: ORBAT = {
    id,
    name,
    templateId,
    assignments: dedupeAssignments(
      mapValid(value.assignments, sanitizeAssignment),
    ),
  };
  if (value.buddyTeams !== undefined) {
    orbat.buddyTeams = dedupeBuddyTeams(
      mapValid(value.buddyTeams, sanitizeBuddyTeam),
    );
  }
  return orbat;
}

export function sanitizeAAR(value: unknown): AAR | null {
  if (!isRecord(value)) return null;
  const id = requiredString(value.id);
  const orbatId = requiredString(value.orbatId);
  const createdAt = requiredString(value.createdAt);
  const updatedAt = requiredString(value.updatedAt);
  if (!id || !orbatId || !createdAt || !updatedAt) return null;
  if (typeof value.title !== 'string' || typeof value.content !== 'string')
    return null;
  return {
    id,
    orbatId,
    title: value.title,
    content: value.content,
    createdAt,
    updatedAt,
  };
}

export interface SanitizedCollection<T> {
  valid: T[];
  /** Records dropped because they were malformed or repeated an id. */
  rejected: number;
}

/**
 * Sanitize an unknown value as a collection of identified records. A non-array
 * counts as one rejection; individual bad records are dropped and counted,
 * never repaired. Ids are unique in the result — first occurrence wins.
 */
export function sanitizeCollection<T extends { id: string }>(
  value: unknown,
  sanitize: (item: unknown) => T | null,
): SanitizedCollection<T> {
  if (!Array.isArray(value)) {
    return { valid: [], rejected: value === undefined ? 0 : 1 };
  }
  const valid: T[] = [];
  const ids = new Set<string>();
  let rejected = 0;
  for (const item of value) {
    const record = sanitize(item);
    if (!record || ids.has(record.id)) {
      rejected++;
      continue;
    }
    ids.add(record.id);
    valid.push(record);
  }
  return { valid, rejected };
}
