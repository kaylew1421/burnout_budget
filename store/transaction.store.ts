// store/transaction.store.ts
import { createMemoryStore } from "./_memory";
import type { Transaction, Reflection } from "../types";

type State = {
  transactions: Transaction[];
  reflections: Reflection[];
};

// --- demo seed (optional) ---
const demo: Transaction[] = [
  {
    id: "t1",
    postedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    amount: 42.18,
    merchantName: "Target",
    category: "Shopping",
  },
  {
    id: "t2",
    postedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    amount: 120.0,
    merchantName: "HEB",
    category: "Groceries",
  },
  {
    id: "t3",
    postedAt: new Date().toISOString(),
    amount: 9.52,
    merchantName: "Starbucks",
    category: "Dining",
  },
];

const store = createMemoryStore<State>({
  transactions: demo, // swap to [] for real users
  reflections: [],
});

export const transactionStore = {
  ...store,

  addTransaction(tx: Transaction) {
    store.setState((s) => ({ ...s, transactions: [tx, ...s.transactions] }));
  },

  addReflection(reflection: Reflection) {
    store.setState((s) => ({ ...s, reflections: [reflection, ...s.reflections] }));
  },

  getTransactionById(id: string) {
    return store.getState().transactions.find((t) => t.id === id);
  },

  getReflectionsForTransaction(transactionId: string) {
    return store.getState().reflections.filter((r) => r.transactionId === transactionId);
  },

  // Optional helpers
  setTransactions(transactions: Transaction[]) {
    store.setState((s) => ({ ...s, transactions }));
  },

  reset() {
    store.setState(() => ({ transactions: [], reflections: [] }));
  },
};
