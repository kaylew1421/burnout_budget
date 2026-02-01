export type AIHistoryItem = { role: "user" | "assistant"; content: string };

export type AISnapshot = {
  burnout?: {
    overall: number;
    emotionalLoad: number;
    financialLoad: number;
    decisionFatigue: number;
    explainers?: { title: string; detail: string; weight: number }[];
  };
  gap?: {
    windowLabel: string;
    startDate: string;
    endDate: string;
    availableNow: number;
    essentialsRemaining: number;
    buffer: number;
    expectedIncomeInWindow: number;
    neededTotal: number;
    gap: number;
  };
};

export type AIChatRequest = {
  userMessage: string;
  snapshot?: AISnapshot;
  history?: AIHistoryItem[];
};

export type AIAction =
  | { type: "open"; label: string; href: string }
  | { type: "prefillExpense"; label: string; merchantName?: string; amount?: number; category?: string };

export type AIChatResponse = {
  assistantMessage: string;
  quickReplies?: string[];
  actions?: AIAction[];
};
