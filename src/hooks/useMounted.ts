import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns `false` on server side rendering and `true` once mounted on client side.
 * Uses `useSyncExternalStore` to prevent hydration mismatches without triggering
 * React 19 / React Compiler `react-hooks/set-state-in-effect` lint errors.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
