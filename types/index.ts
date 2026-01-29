export type ID = string;
export type Money = number;

export type Mood = "okay" | "overwhelmed" | "stressed" | "calm" | "tired";
export type StressLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type TxCategory =
  | "Groceries"
  | "Dining"
  | "Shopping"
  | "Bills"
  | "Gas"
  | "Health"
  | "Other";

export type Transaction = {
  id: ID;
  postedAt: string; // ISO
  amount: Money;
  merchantName: string;
  category: TxCategory;
  isPending?: boolean;
};

export type Reflection = {
  id: ID;
  transactionId: ID;
  createdAt: string; // ISO
  stress: "low_stress" | "neutral" | "high_stress";
  reasonTags: string[];
  note?: string;
};

export type DailyCheckIn = {
  id: ID;
  date: string; // YYYY-MM-DD
  mood: Mood;
  stress?: StressLevel;
};
