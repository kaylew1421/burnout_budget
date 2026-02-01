import { useEffect } from "react";
import { useStore } from "./useStore";
import { onboardingStore } from "../store/onboarding.store";

export function useOnboarding() {
  const state = useStore(onboardingStore);

  useEffect(() => {
    onboardingStore.hydrate();
  }, []);

  return {
    ...state,
    setHasOnboarded: onboardingStore.setHasOnboarded,
  };
}
