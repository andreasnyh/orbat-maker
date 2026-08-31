import {
  type CollisionDetection,
  closestCenter,
  closestCorners,
  getFirstCollision,
  KeyboardCode,
  type KeyboardCoordinateGetter,
  pointerWithin,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

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

/**
 * Pointer drags keep the existing behaviour exactly: a release outside every
 * droppable drops nothing. A keyboard drag has no pointer at all — dnd-kit
 * reports `pointerCoordinates` as null, because a KeyboardEvent carries no
 * clientX/clientY — so it falls back to geometry, without which nothing could
 * ever be dropped from the keyboard.
 */
export const collisionDetection: CollisionDetection = (args) =>
  args.pointerCoordinates == null ? closestCenter(args) : pointerWithin(args);

/**
 * Move a keyboard drag to the nearest droppable in the arrow key's direction.
 *
 * dnd-kit's own `sortableKeyboardCoordinates` handles the sortable case well,
 * but it gives up when the dragged item is not itself a droppable — it looks
 * the active id up in `droppableContainers` and bails when that misses. That
 * is exactly the case here for assigning personnel: a roster card, and the
 * person inside a filled slot, are draggable but not droppable. So delegate
 * the sortable case and cover the rest.
 */
export const keyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  // `args.active` is the dragged item's id; the Active object lives on the
  // context. A hit here means the dragged item is a sortable.
  if (args.context.droppableContainers.get(args.active)) {
    return sortableKeyboardCoordinates(event, args);
  }
  return nearestInDirection(event, args);
};

const nearestInDirection: KeyboardCoordinateGetter = (
  event,
  {
    context: {
      active,
      collisionRect,
      droppableRects,
      droppableContainers,
      over,
    },
  },
) => {
  if (!ARROW_KEYS.includes(event.code)) return undefined;
  event.preventDefault();
  if (!active || !collisionRect) return undefined;

  const ahead = droppableContainers.getEnabled().filter((container) => {
    if (!container || container.disabled) return false;
    const rect = droppableRects.get(container.id);
    if (!rect) return false;
    switch (event.code) {
      case KeyboardCode.Down:
        return collisionRect.top < rect.top;
      case KeyboardCode.Up:
        return collisionRect.top > rect.top;
      case KeyboardCode.Right:
        return collisionRect.left < rect.left;
      default:
        return collisionRect.left > rect.left;
    }
  });

  const collisions = closestCorners({
    active,
    collisionRect,
    droppableRects,
    droppableContainers: ahead,
    pointerCoordinates: null,
  });

  let closestId = getFirstCollision(collisions, 'id');
  // Without this an arrow key can land back on the target already under the
  // drag, which reads as the keyboard being stuck.
  if (closestId === over?.id && collisions.length > 1) {
    closestId = collisions[1].id;
  }
  if (closestId == null) return undefined;

  const target = droppableRects.get(closestId);
  if (!target) return undefined;

  // The getter works in the same viewport space the sensor reads the dragged
  // node's rect from, so the target's top-left is the new position.
  return { x: target.left, y: target.top };
};
