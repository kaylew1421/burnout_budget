// store/settings.store.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createMemoryStore } from "./_memory";

export type Rounding = "none" | "nearest_5" | "nearest_10";

export type SettingsState = {
  // Profile-ish (beta)
  displayName: string;

  // Gap math prefs
  bufferPercent: number; // e.g. 0.05
  rounding: Rounding;
  includeNonEssentialBillsInGap: boolean;

  // UX prefs
  haptics: boolean;
  showCoachNotes: boolean;

  // App prefs
  weeklySummary: boolean;
};

const STORAGE_KEY = "burnout_budget_settings_v1";

const defaults: SettingsState = {
  displayName: "Kayla",
  bufferPercent: 0.05,
  rounding: "nearest_5",
  includeNonEssentialBillsInGap: false,
  haptics: true,
  showCoachNotes: true,
  weeklySummary: false,
};

const store = createMemoryStore<SettingsState>(defaults);

let hydrated = false;
let saveTimer: any = null;

async function persist(state: SettingsState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // swallow for beta; could show toast later
  }
}

export const settingsStore = {
  ...store,

  async hydrate() {
    if (hydrated) return;
    hydrated = true;

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      store.setState((s) => ({ ...s, ...parsed }));
    } catch {
      // ignore bad/missing storage
    }
  },

  setSettings(patch: Partial<SettingsState>) {
    store.setState((s) => {
      const next = { ...s, ...patch };

      // debounce saves so we don't write on every keystroke
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        persist(next);
      }, 250);

      return next;
    });
  },

  async reset() {
    store.setState(() => ({ ...defaults }));
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};
