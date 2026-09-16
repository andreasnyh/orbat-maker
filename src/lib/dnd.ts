import {
  type Active,
  type CollisionDetection,
  closestCorners,
  type Data,
  type DroppableContainer,
  getFirstCollision,
  KeyboardCode,
  type KeyboardCoordinateGetter,
  type KeyboardSensorOptions,
  pointerWithin,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  hasSortableData,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

/**
 * Drag-and-drop behaviour shared by the ORBAT builder and the template editor,
 * so keyboard support cannot drift between them.
 */

const ARROW_KEYS: string[] = [
  KeyboardCode.Down,
  KeyboardCode.Right,
  KeyboardCode.Up,
  KeyboardCode.Left,
];

type Kind = 'group' | 'person' | 'slot-list' | 'slot';

/**
 * What a draggable or droppable is, from the `data` both pages give them:
 * `type: 'group'` is a template-editor group, `type: 'person'` a roster card
 * or a slot's occupant, and `type: 'slot-reorder'` without a `slotId` a
 * group's slot list. Everything else is a slot.
 */
function kindOf(data: Data | undefined): Kind {
  if (data?.type === 'group') return 'group';
  if (data?.type === 'person') return 'person';
  if (data?.type === 'slot-reorder' && data.slotId == null) return 'slot-list';
  return 'slot';
}

/**
 * The droppables a keyboard drag may land on:
 *
 * - a group only trades places with another group;
 * - a person only lands on a slot, a droppable carrying a `slotId`;
 * - a slot lands on another slot, or on the slot list of an empty group.
 *
 * A list with slots in it is left out even though a pointer can drop on it.
 * It encloses its own slots, so it would often measure nearer than they do
 * and swallow the arrow press meant for them.
 */
function suitableTargets(
  active: Active,
  containers: DroppableContainer[],
): DroppableContainer[] {
  const dragged = kindOf(active.data.current);
  const groupsWithSlots = new Set(
    containers
      .filter((container) => kindOf(container.data.current) === 'slot')
      .map((container) => container.data.current?.groupId),
  );
  return containers.filter((container) => {
    const into = container.data.current;
    const kind = kindOf(into);
    if (dragged === 'group') return kind === 'group';
    if (dragged === 'person') return into?.slotId != null;
    return (
      kind === 'slot' ||
      (kind === 'slot-list' && !groupsWithSlots.has(into?.groupId))
    );
  });
}

/**
 * The target each keyboard drag's last arrow press moved it to. dnd-kit makes
 * a fresh `Active` for every drag, so an entry lives exactly as long as its
 * drag.
 */
const keyboardTargets = new WeakMap<Active, UniqueIdentifier>();

/**
 * Pointer drags keep the existing behaviour exactly: a release outside every
 * droppable drops nothing. A keyboard drag has no pointer at all — dnd-kit
 * reports `pointerCoordinates` as null, because a KeyboardEvent carries no
 * clientX/clientY — so its target is the one the arrow keys chose.
 *
 * Reading that choice back, rather than measuring which droppable ended up
 * nearest, matters when the dragged item and its target differ in size: a
 * tall group moved past a short one sits closer to where it started than to
 * the group it was moved to.
 */
export const collisionDetection: CollisionDetection = (args) => {
  if (args.pointerCoordinates != null) return pointerWithin(args);
  const { active, droppableContainers } = args;
  // Before the first arrow press a sortable rests on itself, as it would under
  // a pointer. Anything else has no target yet; otherwise Space or Tab straight
  // after picking up a roster card would drop it on whichever slot was nearest.
  const targetId =
    keyboardTargets.get(active) ??
    (hasSortableData(active) ? active.id : undefined);
  const target = suitableTargets(active, droppableContainers).find(
    (container) => container.id === targetId,
  );
  return target
    ? [{ id: target.id, data: { droppableContainer: target, value: 0 } }]
    : [];
};

/** dnd-kit's container lookups, over a subset of the containers. */
class Containers extends Map<UniqueIdentifier, DroppableContainer> {
  get(id: UniqueIdentifier | null | undefined) {
    return id == null ? undefined : super.get(id);
  }
  toArray() {
    return [...this.values()];
  }
  getEnabled() {
    return this.toArray().filter((container) => !container.disabled);
  }
  getNodeFor(id: UniqueIdentifier | null | undefined) {
    return this.get(id)?.node.current ?? undefined;
  }
}

/**
 * Move a keyboard drag to the nearest suitable droppable in the arrow key's
 * direction, and remember it as the drag's target.
 *
 * dnd-kit's own `sortableKeyboardCoordinates` places a sortable well, but it
 * gives up when the dragged item is not itself a droppable — it looks the
 * active id up in `droppableContainers` and bails when that misses. That is
 * exactly the case here for assigning personnel: a roster card, and the person
 * inside a filled slot, are draggable but not droppable. So the target is
 * chosen here, by the same rule it uses, and only the placing of a sortable is
 * left to it.
 */
const keyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  if (!ARROW_KEYS.includes(event.code)) return undefined;
  event.preventDefault();
  // Both pages are vertical lists. A sideways arrow would jump to whatever
  // happens to start further left or right, such as the top of the list.
  if (event.code === KeyboardCode.Left || event.code === KeyboardCode.Right) {
    return undefined;
  }
  const { active, collisionRect, droppableRects, droppableContainers, over } =
    args.context;
  if (!active || !collisionRect) return undefined;

  const suitable = new Containers(
    suitableTargets(active, droppableContainers.toArray()).map((container) => [
      container.id,
      container,
    ]),
  );
  const down = event.code === KeyboardCode.Down;
  const ahead = suitable.getEnabled().filter((container) => {
    const rect = droppableRects.get(container.id);
    if (!rect) return false;
    return down ? collisionRect.top < rect.top : collisionRect.top > rect.top;
  });

  const collisions = closestCorners({
    active,
    collisionRect,
    droppableRects,
    droppableContainers: ahead,
    pointerCoordinates: null,
  });

  let targetId = getFirstCollision(collisions, 'id');
  // Without this an arrow key can land back on the target already under the
  // drag, which reads as the keyboard being stuck.
  if (targetId === over?.id && collisions.length > 1) {
    targetId = collisions[1].id;
  }
  if (targetId == null) return undefined;

  let coordinates: ReturnType<KeyboardCoordinateGetter>;
  if (hasSortableData(active)) {
    // Given the same containers it settles on the same target, and lines the
    // item up with it so the list's preview reads right.
    coordinates = sortableKeyboardCoordinates(event, {
      ...args,
      context: { ...args.context, droppableContainers: suitable },
    });
  } else {
    // The getter works in the same viewport space the sensor reads the dragged
    // node's rect from, so the target's top-left is the new position.
    const target = droppableRects.get(targetId);
    coordinates = target && { x: target.left, y: target.top };
  }
  if (coordinates) keyboardTargets.set(active, targetId);
  return coordinates;
};

/**
 * dnd-kit ends a keyboard drag on Tab as well as on Space and Enter, so
 * tabbing away mid-drag would drop the item wherever it happened to be. Here
 * Tab cancels, like Escape.
 */
export const keyboardSensorOptions: KeyboardSensorOptions = {
  coordinateGetter: keyboardCoordinates,
  keyboardCodes: {
    start: [KeyboardCode.Space, KeyboardCode.Enter],
    cancel: [KeyboardCode.Esc, KeyboardCode.Tab],
    end: [KeyboardCode.Space, KeyboardCode.Enter],
  },
};
