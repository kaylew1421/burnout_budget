// hooks/useStore.ts
import { useSyncExternalStore } from "react";

/**
 * Minimal external-store contract.
 * Your store must implement:
 * - getState(): returns current state
 * - subscribe(listener): returns unsubscribe function
 */
export type ExternalStore<T> = {
  getState: () => T;
  subscribe: (listener: () => void) => () => void;
};

/**
 * useStore with optional selector.
 *
 * If no selector is provided, the whole state is returned.
 * If a selector is provided, only that slice is tracked for updates.
 */
export function useStore<T, S = T>(
  store: ExternalStore<T>,
  selector?: (state: T) => S
): S {
  const getSnapshot = () => {
    const state = store.getState();
    return selector ? selector(state) : (state as unknown as S);
  };

  return useSyncExternalStore(
    store.subscribe,
    getSnapshot,
    getSnapshot // for SSR parity (safe in Expo)
  );
}
