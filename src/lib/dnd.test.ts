import type { Active, DroppableContainer } from '@dnd-kit/core';
import { describe, expect, it } from 'vitest';
import { collisionDetection, keyboardSensorOptions } from './dnd';

type Fake = { id: string; data: Record<string, unknown>; top: number };

const rectAt = (top: number) => ({
  top,
  left: 0,
  bottom: top + 10,
  right: 10,
  width: 10,
  height: 10,
});

const activeWith = (id: string, data: Record<string, unknown>) =>
  ({ id, data: { current: data } }) as unknown as Active;

function arrowDown(active: Active, fakes: Fake[]) {
  const containers = fakes.map((fake) => ({
    id: fake.id,
    data: { current: fake.data },
    disabled: false,
  })) as unknown as DroppableContainer[];
  const droppableRects = new Map(fakes.map((f) => [f.id, rectAt(f.top)]));
  const context = {
    active,
    collisionRect: rectAt(0),
    droppableRects,
    droppableContainers: { toArray: () => containers },
    over: null,
  };
  const coordinates = keyboardSensorOptions.coordinateGetter?.(
    { code: 'ArrowDown', preventDefault: () => {} } as KeyboardEvent,
    { context, currentCoordinates: { x: 0, y: 0 } } as never,
  );
  const chosen = collisionDetection({
    active,
    collisionRect: rectAt(0),
    droppableRects,
    droppableContainers: containers,
    pointerCoordinates: null,
  } as never);
  return { coordinates, chosen: chosen.map((c) => c.id) };
}

describe('keyboard drag targeting', () => {
  it('targets a slot, not a nearer group or slot list, for a person', () => {
    const { coordinates, chosen } = arrowDown(
      activeWith('p1', { type: 'person' }),
      [
        { id: 'group', data: { type: 'group' }, top: 20 },
        { id: 'list', data: { type: 'slot-reorder', groupId: 'g' }, top: 30 },
        { id: 'slot', data: { slotId: 's1', groupId: 'g' }, top: 100 },
      ],
    );
    expect(chosen).toEqual(['slot']);
    expect(coordinates).toEqual({ x: 0, y: 100 });
  });

  it('targets a group, not a nearer slot, for a group', () => {
    const { chosen } = arrowDown(activeWith('g1', { type: 'group' }), [
      { id: 'slot', data: { slotId: 's1', groupId: 'g' }, top: 20 },
      { id: 'group', data: { type: 'group' }, top: 100 },
    ]);
    expect(chosen).toEqual(['group']);
  });

  it('drops nothing when Space comes before any arrow key', () => {
    const result = collisionDetection({
      active: activeWith('p1', { type: 'person' }),
      collisionRect: rectAt(0),
      droppableRects: new Map([['slot', rectAt(0)]]),
      droppableContainers: [
        { id: 'slot', data: { current: { slotId: 's1' } } },
      ] as unknown as DroppableContainer[],
      pointerCoordinates: null,
    } as never);
    expect(result).toEqual([]);
  });
});
