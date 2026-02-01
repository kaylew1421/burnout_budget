// hooks/useSubscription.ts
import { useCallback, useMemo } from "react";
import { useStore } from "./useStore";
import { subscriptionStore } from "../store/subscription.store";

export function useSubscription() {
  // ✅ Only subscribe to isPro
  const isPro = useStore(subscriptionStore, (s) => s.isPro);

  const setPro = useCallback((v: boolean) => {
    subscriptionStore.setPro(v);
  }, []);

  return useMemo(
    () => ({
      isPro,
      setPro,
    }),
    [isPro, setPro]
  );
}
