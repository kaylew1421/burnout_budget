// store/subscription.store.ts
import { createMemoryStore } from "./_memory";

type State = {
  isPro: boolean;
};

const store = createMemoryStore<State>({
  isPro: false, // demo default
});

export const subscriptionStore = {
  ...store,

  setPro(isPro: boolean) {
    store.setState((s) => ({ ...s, isPro }));
  },
};
