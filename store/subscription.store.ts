import { createMemoryStore } from "./_memory";
type State = { isPro: boolean };
const store = createMemoryStore<State>({ isPro: false });
export const subscriptionStore = {
  ...store,
  setPro(v: boolean) { store.setState(() => ({ isPro: v })); },
};
