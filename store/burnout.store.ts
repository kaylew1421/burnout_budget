import { createMemoryStore } from "./_memory";
export type BurnoutDims = { overall: number; emotionalLoad: number; financialLoad: number; decisionFatigue: number };
const store = createMemoryStore<{ dims: BurnoutDims }>({ dims: { overall: 38, emotionalLoad: 35, financialLoad: 40, decisionFatigue: 32 } });
export const burnoutStore = store;
