import { useEffect, useState } from "react";
import type { Listener } from "../store/_memory";

export function useMemoryStore<T>(store: { getState: () => T; subscribe: (l: Listener<T>) => () => void }) {
  const [state, setState] = useState<T>(store.getState());
  useEffect(() => store.subscribe(setState), [store]);
  return state;
}
