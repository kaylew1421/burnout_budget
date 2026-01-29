import type { BurnoutInput, BurnoutResult } from "./burnout.types";

export function computeBurnout(input: BurnoutInput): BurnoutResult {
  const now = Date.now();
  const msWindow = input.lookbackDays * 24 * 60 * 60 * 1000;

  const tx = input.transactions.filter((t) => now - new Date(t.postedAt).getTime() <= msWindow);
  const refl = input.reflections.filter((r) => now - new Date(r.createdAt).getTime() <= msWindow);
  const checks = input.dailyCheckIns;

  const spendTotal = tx.reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const spendPerDay = spendTotal / Math.max(1, input.lookbackDays);

  const highStressCount = refl.filter((r) => r.stress === "high_stress").length;
  const stressRatio = refl.length ? highStressCount / refl.length : 0;

  const moodPenalty = checks.reduce((sum, c) => sum + (c.mood === "overwhelmed" || c.mood === "stressed" ? 1 : 0), 0);
  const moodRatio = checks.length ? moodPenalty / checks.length : 0;

  const financialLoad = clamp01(spendPerDay / 120) * 100;
  const emotionalLoad = clamp01(stressRatio * 1.1 + moodRatio * 0.6) * 100;
  const decisionFatigue = clamp01((tx.length / (input.lookbackDays * 6)) + stressRatio * 0.3) * 100;

  const overall = clamp01((financialLoad * 0.4 + emotionalLoad * 0.4 + decisionFatigue * 0.2) / 100) * 100;

  const explainers = [
    { title: "Spending pressure", detail: `Avg spend/day ≈ ${spendPerDay.toFixed(0)}.`, weight: Math.round(financialLoad) },
    { title: "Stress reflections", detail: `${highStressCount}/${refl.length || 0} reflections marked high stress.`, weight: Math.round(emotionalLoad) },
    { title: "Decision load", detail: `${tx.length} transactions in the last ${input.lookbackDays} days.`, weight: Math.round(decisionFatigue) },
  ];

  return {
    dims: {
      overall: Math.round(overall),
      emotionalLoad: Math.round(emotionalLoad),
      financialLoad: Math.round(financialLoad),
      decisionFatigue: Math.round(decisionFatigue),
    },
    explainers,
  };
}
function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }
