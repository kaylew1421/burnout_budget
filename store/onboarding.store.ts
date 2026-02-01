import AsyncStorage from "@react-native-async-storage/async-storage";
import { createMemoryStore } from "./_memory";

type OnboardingState = {
  hasOnboarded: boolean;
};

const KEY = "burnout_has_onboarded";

const store = createMemoryStore<OnboardingState>({
  hasOnboarded: false,
});

async function hydrate() {
  const v = await AsyncStorage.getItem(KEY);
  if (v === "true") {
    store.setState(() => ({ hasOnboarded: true }));
  }
}

async function setHasOnboarded(v: boolean) {
  await AsyncStorage.setItem(KEY, String(v));
  store.setState(() => ({ hasOnboarded: v }));
}

export const onboardingStore = {
  ...store,
  hydrate,
  setHasOnboarded,
};
