import { type RefObject, useEffect } from 'react';

export function useFocusWhen(
  ref: RefObject<HTMLElement | null>,
  condition: boolean,
  options?: { select?: boolean },
) {
  const select = options?.select ?? false;

  // biome-ignore lint/correctness/useExhaustiveDependencies: ref is stable; focus/select are imperative side-effects that only need to re-run when condition or select changes
  useEffect(() => {
    if (!condition) return;
    const el = ref.current;
    if (!el) return;
    el.focus();
    if (select && el instanceof HTMLInputElement) {
      el.select();
    }
  }, [condition, select]);
}
