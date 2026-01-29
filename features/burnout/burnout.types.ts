export type BurnoutDims = { overall: number; emotionalLoad: number; financialLoad: number; decisionFatigue: number };
export type BurnoutExplainer = { title: string; detail: string; weight: number };
export type BurnoutInput = {
  lookbackDays: number;
  transactions: { amount: number; postedAt: string; category?: string }[];
  reflections: { createdAt: string; stress: "low_stress" | "neutral" | "high_stress" }[];
  dailyCheckIns: { date: string; mood: string; stress?: number }[];
};
export type BurnoutResult = { dims: BurnoutDims; explainers: BurnoutExplainer[] };
