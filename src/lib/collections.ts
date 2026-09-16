/**
 * Append the incoming records whose ids are not already present. Returns the
 * original array when nothing is new, so callers skip a needless write.
 */
export function mergeById<T extends { id: string }>(
  existing: T[],
  incoming: T[],
): T[] {
  const ids = new Set(existing.map((item) => item.id));
  const fresh = incoming.filter((item) => !ids.has(item.id));
  return fresh.length > 0 ? [...existing, ...fresh] : existing;
}
