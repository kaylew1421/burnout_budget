import { createMemoryStore } from "./_memory";
import type { Bill, IncomeItem, AccountBalance } from "../features/gap/gap.types";
import { addDaysYMD, ymd } from "../lib/date";

type State = {
  accounts: AccountBalance[];
  bills: Bill[];
  income: IncomeItem[];
};

function uid(prefix = "x") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// ✅ Demo starter data (replace later with real user input)
const today = ymd();

const demoAccounts: AccountBalance[] = [
  { id: "a1", name: "Checking", available: 780, includeInGap: true },
];

const demoBills: Bill[] = [
  {
    id: "b1",
    name: "Rent",
    type: "rent",
    amount: 1200,
    dueDate: addDaysYMD(today, 4),
    cadence: "monthly",
    isEssential: true,
  },
  {
    id: "b2",
    name: "Electric",
    type: "utilities",
    amount: 165,
    dueDate: addDaysYMD(today, 10),
    cadence: "monthly",
    isEssential: true,
  },
  {
    id: "b3",
    name: "Phone",
    type: "phone",
    amount: 80,
    dueDate: addDaysYMD(today, 12),
    cadence: "monthly",
    isEssential: true,
  },
  {
    id: "b4",
    name: "Streaming",
    type: "subscription",
    amount: 19.99,
    dueDate: addDaysYMD(today, 7),
    cadence: "monthly",
    isEssential: false,
  },
];

const demoIncome: IncomeItem[] = [
  {
    id: "i1",
    name: "Paycheck",
    amount: 900,
    expectedDate: addDaysYMD(today, 6),
    confidence: "medium",
  },
];

const store = createMemoryStore<State>({
  accounts: demoAccounts,
  bills: demoBills,
  income: demoIncome,
});

export const billStore = {
  ...store,

  // --------- Accounts ----------
  setAccounts(accounts: AccountBalance[]) {
    store.setState((s) => ({ ...s, accounts }));
  },

  // --------- Bills ----------
  addBill(partial: Omit<Bill, "id">) {
    const bill: Bill = { id: uid("b"), ...partial };
    store.setState((s) => ({ ...s, bills: [bill, ...s.bills] }));
    return bill;
  },

  updateBill(id: string, patch: Partial<Omit<Bill, "id">>) {
    store.setState((s) => ({
      ...s,
      bills: s.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  },

  deleteBill(id: string) {
    store.setState((s) => ({ ...s, bills: s.bills.filter((b) => b.id !== id) }));
  },

  getBillById(id: string) {
    return store.getState().bills.find((b) => b.id === id);
  },

  // --------- Income ----------
  addIncome(partial: Omit<IncomeItem, "id">) {
    const item: IncomeItem = { id: uid("i"), ...partial };
    store.setState((s) => ({ ...s, income: [item, ...s.income] }));
    return item;
  },

  updateIncome(id: string, patch: Partial<Omit<IncomeItem, "id">>) {
    store.setState((s) => ({
      ...s,
      income: s.income.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  },

  deleteIncome(id: string) {
    store.setState((s) => ({ ...s, income: s.income.filter((i) => i.id !== id) }));
  },
};
