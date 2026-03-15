import { useCallback, useState } from 'react';

/** Boolean state hook. Returns `[value, toggle, setValue]`. */
export function useToggle(
  initial = false,
): [value: boolean, toggle: () => void, setValue: (v: boolean) => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle, setValue];
}
