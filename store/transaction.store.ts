import { createMemoryStore } from "./_memory";
import type { Transaction, Reflection } from "../types";

type State = {
  transactions: Transaction[];
  reflections: Reflection[];
};

const demo: Transaction[] = [
  { id: "t1", postedAt: new Date(Date.now() - 86400000 * 2).toISOString(), amount: 42.18, merchantName: "Target", category: "Shopping" },
  { id: "t2", postedAt: new Date(Date.now() - 86400000 * 1).toISOString(), amount: 120.00, merchantName: "HEB", category: "Groceries" },
  { id: "t3", postedAt: new Date().toISOString(), amount: 9.52, merchantName: "Starbucks", category: "Dining" },
];

const store = createMemoryStore<State>({ transactions: demo, reflections: [] });

export const transactionStore = {
  ...store,
  addReflection(reflection: Reflection) {
    store.setState((s) => ({ ...s, reflections: [reflection, ...s.reflections] }));
  },
};
