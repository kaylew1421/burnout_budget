export type Listener<T> = (state: T) => void;

export function createMemoryStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<Listener<T>>();

  function getState() { return state; }
  function setState(updater: (prev: T) => T) {
    state = updater(state);
    listeners.forEach((l) => l(state));
  }
  function subscribe(listener: Listener<T>) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, setState, subscribe };
}
