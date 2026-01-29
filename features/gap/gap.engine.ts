import type { GapInput, GapResult } from "./gap.types";
import { ymd } from "../../lib/date";

export function computeGap(input: GapInput): GapResult {
  const start = ymd(new Date());
  const end = input.mode === "next_14_days" ? addDays(start, 14) : endOfMonth(start);

  const availableNow = round(input.accounts.filter(a => a.includeInGap).reduce((s,a)=>s+a.available,0), input.rounding);

  const billsInWindow = input.bills.filter(b => b.dueDate >= start && b.dueDate <= end);
  const essentialsRemaining = round(billsInWindow.filter(b=>b.isEssential).reduce((s,b)=>s+b.amount,0), input.rounding);
  const nonEssentialsRemaining = round(billsInWindow.filter(b=>!b.isEssential).reduce((s,b)=>s+b.amount,0), input.rounding);

  const incomeInWindow = round(input.income.filter(i => i.expectedDate >= start && i.expectedDate <= end).reduce((s,i)=>s+i.amount,0), input.rounding);

  const baseNeeded = essentialsRemaining + nonEssentialsRemaining;
  const buffer = round(baseNeeded * input.bufferPercent, input.rounding);

  const neededTotal = round(baseNeeded + buffer, input.rounding);
  const gap = round(Math.max(0, neededTotal - (availableNow + incomeInWindow)), input.rounding);

  return {
    window: { label: input.mode === "next_14_days" ? "Next 14 days" : "Through end of month", startDate: start, endDate: end },
    breakdown: { availableNow, essentialsRemaining, nonEssentialsRemaining, expectedIncomeInWindow: incomeInWindow, buffer, neededTotal, gap },
  };
}

function endOfMonth(ymdStr: string) {
  const d = new Date(`${ymdStr}T12:00:00.000Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}
function addDays(ymdStr: string, days: number) {
  const d = new Date(`${ymdStr}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function round(n: number, mode: GapInput["rounding"]) {
  if (mode === "none") return Math.round(n * 100) / 100;
  const step = mode === "nearest_5" ? 5 : 10;
  return Math.round(n / step) * step;
}
