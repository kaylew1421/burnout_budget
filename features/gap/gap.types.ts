// features/gap/gap.types.ts

export type BillType = "rent" | "utilities" | "phone" | "subscription" | "loan" | "other";
export type Cadence = "monthly" | "weekly" | "one_time";

export type Bill = {
  id: string;
  name: string;
  type: BillType;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  cadence: Cadence;
  isEssential: boolean;
};

export type AccountBalance = {
  id: string;
  name: string;
  available: number;
  includeInGap: boolean;
};

export type IncomeItem = {
  id: string;
  name: string;
  amount: number;
  expectedDate: string; // YYYY-MM-DD
  confidence: "high" | "medium" | "low";
};

export type GapMode = "through_end_of_month" | "next_14_days";

export type GapInput = {
  mode: GapMode;
  startDate?: string; // optional anchor date (YYYY-MM-DD)
  accounts: AccountBalance[];
  bills: Bill[];
  income: IncomeItem[];
  bufferPercent: number; // e.g. 0.05
  rounding: "none" | "nearest_5" | "nearest_10";
};

export type GapResult = {
  window: { label: string; startDate: string; endDate: string };
  breakdown: {
    availableNow: number;
    essentialsRemaining: number;
    nonEssentialsRemaining: number;
    expectedIncomeInWindow: number;
    buffer: number;
    neededTotal: number;
    gap: number;
  };
  // optional helpers for UI later
  lists?: {
    billsInWindow?: Bill[];
    incomeInWindow?: IncomeItem[];
  };
};
