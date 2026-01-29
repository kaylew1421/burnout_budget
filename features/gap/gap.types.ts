export type Bill = {
  id: string;
  name: string;
  type: "rent" | "utilities" | "phone" | "subscription" | "loan" | "other";
  amount: number;
  dueDate: string;
  cadence: "monthly" | "weekly" | "one_time";
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
  expectedDate: string;
  confidence: "high" | "medium" | "low";
};

export type GapMode = "through_end_of_month" | "next_14_days";

export type GapInput = {
  mode: GapMode;
  accounts: AccountBalance[];
  bills: Bill[];
  income: IncomeItem[];
  bufferPercent: number;
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
};
