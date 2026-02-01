import type { BurnoutInput, BurnoutResult } from "./burnout.types";

type InternalStats = {
  spendTotal: number;
  spendPerDay: number;
  txCount: number;
  highStressCount: number;
  reflectionCount: number;
  stressRatio: number;
  moodRatio: number;
};

export function computeBurnout(input: BurnoutInput): BurnoutResult {
  const now = Date.now();
  const msWindow = input.lookbackDays * 24 * 60 * 60 * 1000;

  const tx = input.transactions.filter(
    (t) => now - new Date(t.postedAt).getTime() <= msWindow
  );
  const refl = input.reflections.filter(
    (r) => now - new Date(r.createdAt).getTime() <= msWindow
  );
  const checks = input.dailyCheckIns ?? [];

  const stats = computeStats(input.lookbackDays, tx, refl, checks);

  // --- Personal baseline (beta-friendly) ---
  // If you don’t have enough history, fall back to a gentle default.
  // Later, replace this with a user setting or a rolling 30-day baseline.
  const baselineSpendPerDay = Math.max(30, Math.min(200, stats.spendPerDay || 60));

  // --- Confidence adjustment ---
  // If reflections are sparse, don’t let one entry dominate.
  const reflConfidence = clamp01(stats.reflectionCount / 6); // 0..1 (6 reflections = “confident”)

  // Financial load: compares current avg/day to baseline, with soft cap
  const financialLoad = clamp01(stats.spendPerDay / (baselineSpendPerDay * 1.35)) * 100;

  // Emotional load: blend stress + mood, but scale stress by confidence
  const emotionalLoad =
    clamp01((stats.stressRatio * 1.1 * reflConfidence) + (stats.moodRatio * 0.75)) * 100;

  // Decision fatigue: transactions/day + stress component
  const txPerDay = stats.txCount / Math.max(1, input.lookbackDays);
  const decisionFatigue = clamp01((txPerDay / 6) + (stats.stressRatio * 0.25 * reflConfidence)) * 100;

  const overallRaw =
    (financialLoad * 0.4 + emotionalLoad * 0.4 + decisionFatigue * 0.2);

  const overall = clamp01(overallRaw / 100) * 100;

  const explainers = buildExplainers({
    lookbackDays: input.lookbackDays,
    baselineSpendPerDay,
    ...stats,
    financialLoad,
    emotionalLoad,
    decisionFatigue,
  });

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

function computeStats(
  lookbackDays: number,
  tx: { amount: number; postedAt: string }[],
  refl: { createdAt: string; stress: "low_stress" | "neutral" | "high_stress" }[],
  checks: { date: string; mood: string }[]
): InternalStats {
  const spendTotal = tx.reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const spendPerDay = spendTotal / Math.max(1, lookbackDays);

  const highStressCount = refl.filter((r) => r.stress === "high_stress").length;
  const stressRatio = refl.length ? highStressCount / refl.length : 0;

  const moodPenalty = checks.reduce((sum, c) => {
    const m = (c.mood || "").toLowerCase();
    return sum + (m.includes("overwhelmed") || m.includes("stressed") ? 1 : 0);
  }, 0);
  const moodRatio = checks.length ? moodPenalty / checks.length : 0;

  return {
    spendTotal,
    spendPerDay,
    txCount: tx.length,
    highStressCount,
    reflectionCount: refl.length,
    stressRatio,
    moodRatio,
  };
}

function buildExplainers(args: {
  lookbackDays: number;
  baselineSpendPerDay: number;
  spendPerDay: number;
  txCount: number;
  highStressCount: number;
  reflectionCount: number;
  financialLoad: number;
  emotionalLoad: number;
  decisionFatigue: number;
}) {
  const { lookbackDays } = args;

  const spendDelta = args.spendPerDay - args.baselineSpendPerDay;
  const spendDeltaLine =
    Math.abs(spendDelta) < 5
      ? "about normal for you"
      : spendDelta > 0
      ? `${Math.round(spendDelta)} more than your baseline`
      : `${Math.round(Math.abs(spendDelta))} less than your baseline`;

  return [
    {
      title: "Spending pressure",
      detail: `Avg/day ≈ ${args.spendPerDay.toFixed(0)} (${spendDeltaLine}).`,
      weight: Math.round(args.financialLoad),
    },
    {
      title: "Stress check-ins",
      detail: args.reflectionCount
        ? `${args.highStressCount}/${args.reflectionCount} reflections felt high-stress.`
        : "No reflections logged yet (that’s okay).",
      weight: Math.round(args.emotionalLoad),
    },
    {
      title: "Decision load",
      detail: `${args.txCount} purchases in the last ${lookbackDays} days.`,
      weight: Math.round(args.decisionFatigue),
    },
  ];
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
