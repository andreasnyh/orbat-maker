/**
 * @vitest-environment happy-dom
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { memoryAdapter, setStorageAdapter } from '../lib/storage';
import type { Template } from '../types';
import {
  AppStateProvider,
  useCrossCuttingState,
  useOrbatsState,
  useTemplatesState,
} from './AppStateContext';

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

interface Probe {
  templates: ReturnType<typeof useTemplatesState>;
  orbats: ReturnType<typeof useOrbatsState>;
  crossCutting: ReturnType<typeof useCrossCuttingState>;
}

let probe: Probe;
let root: Root;
let container: HTMLElement;

function ProbeChild() {
  probe = {
    templates: useTemplatesState(),
    orbats: useOrbatsState(),
    crossCutting: useCrossCuttingState(),
  };
  return null;
}

const slotIds = (t: Template) =>
  t.groups.flatMap((g) => g.slots.map((s) => s.id));
const groupIds = (t: Template) => t.groups.map((g) => g.id);

function defaultTemplate(): Template {
  const found = probe.templates.templates.find((t) => t.isDefault);
  if (!found) throw new Error('no default template seeded');
  return found;
}

beforeEach(async () => {
  setStorageAdapter(memoryAdapter());
  container = document.createElement('div');
  root = createRoot(container);
  await act(async () => {
    root.render(
      createElement(AppStateProvider, null, createElement(ProbeChild)),
    );
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
});

describe('ensureOwnTemplate', () => {
  it('forks a default template and points the ORBAT at the fork', async () => {
    const original = defaultTemplate();
    const before = probe.templates.templates.length;

    let created = { id: '' };
    await act(async () => {
      created = probe.orbats.createOrbat('Alpha', original);
    });

    const groupId = original.groups[0].id;
    let forkId: string | null = null;
    let added = { id: '' };
    await act(async () => {
      // A queued update beforehand is what real event handlers produce.
      probe.orbats.updateOrbat(created.id, { name: 'x' });
      forkId = probe.crossCutting.ensureOwnTemplate(created.id);
      if (forkId) added = probe.templates.addSlotToGroup(forkId, groupId, 'X');
    });

    expect(forkId).not.toBeNull();
    expect(forkId).not.toBe(original.id);
    const { templates } = probe.templates;
    expect(templates).toHaveLength(before + 1);
    const fork = templates.find((t) => t.id === forkId) as Template;
    expect(fork).toBeDefined();
    expect(groupIds(fork)).toEqual(groupIds(original));
    expect(fork.groups[0].slots.at(-1)?.id).toBe(added.id);
    expect(slotIds(fork).filter((id) => id !== added.id)).toEqual(
      slotIds(original),
    );
    expect(slotIds(defaultTemplate())).not.toContain(added.id);
    expect(
      probe.orbats.orbats.find((o) => o.id === created.id)?.templateId,
    ).toBe(forkId);

    let again: string | null = null;
    await act(async () => {
      again = probe.crossCutting.ensureOwnTemplate(created.id);
    });
    expect(again).toBe(forkId);
    expect(probe.templates.templates).toHaveLength(before + 1);
  });
});

describe('duplicateTemplate', () => {
  it('returns the copy with all-new group and slot ids', async () => {
    const original = defaultTemplate();
    const before = probe.templates.templates.length;

    let copy: Template | null = null;
    await act(async () => {
      probe.orbats.createOrbat('Alpha', original);
      copy = probe.templates.duplicateTemplate(original.id);
    });

    const result = copy as Template | null;
    expect(result).not.toBeNull();
    expect(probe.templates.templates).toHaveLength(before + 1);
    expect(probe.templates.templates.some((t) => t.id === result?.id)).toBe(
      true,
    );
    const oldIds = new Set([...groupIds(original), ...slotIds(original)]);
    const newIds = [
      ...groupIds(result as Template),
      ...slotIds(result as Template),
    ];
    expect(newIds.length).toBe(oldIds.size);
    for (const id of newIds) expect(oldIds.has(id)).toBe(false);
  });
});
