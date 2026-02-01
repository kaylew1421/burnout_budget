// hooks/useSettings.ts
import { useEffect, useMemo, useCallback } from "react";
import { useStore } from "./useStore";
import { settingsStore } from "../store/settings.store";
import type { SettingsState } from "../store/settings.store";

let didHydrate = false;

export function useSettings() {
  const state = useStore(settingsStore);

  useEffect(() => {
    // ✅ hydrate only once (even if multiple screens call useSettings)
    if (!didHydrate) {
      didHydrate = true;
      settingsStore.hydrate();
    }
  }, []);

  const setSettings = useCallback((patch: Partial<SettingsState>) => {
    settingsStore.setSettings(patch);
  }, []);

  const reset = useCallback(async () => {
    await settingsStore.reset();
  }, []);

  return useMemo(
    () => ({
      ...state,
      setSettings,
      reset,
    }),
    [state, setSettings, reset]
  );
}
