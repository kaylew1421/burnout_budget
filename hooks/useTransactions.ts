// hooks/useTransactions.ts
import { useCallback, useMemo } from "react";
import { useStore } from "./useStore";
import { transactionStore } from "../store/transaction.store";
import type { Transaction, Reflection } from "../types";

export function useTransactions() {
  // ✅ subscribe to exactly what you need
  const transactions = useStore(transactionStore, (s) => s.transactions);
  const reflections = useStore(transactionStore, (s) => s.reflections);

  const loading = false; // placeholder for SQLite later

  const addTransaction = useCallback((tx: Transaction) => {
    transactionStore.addTransaction(tx);
  }, []);

  const addReflection = useCallback((r: Reflection) => {
    transactionStore.addReflection(r);
  }, []);

  const refresh = useCallback(async () => {
    // noop for memory-store version
  }, []);

  return useMemo(
    () => ({
      transactions,
      reflections,
      loading,
      addTransaction,
      addReflection,
      refresh,
    }),
    [transactions, reflections, loading, addTransaction, addReflection, refresh]
  );
}
