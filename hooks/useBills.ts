// hooks/useBills.ts
import { useMemo } from "react";
import { useStore } from "./useStore";
import { billStore } from "../store/bill.store";

export function useBills() {
  const state = useStore(billStore);

  /**
   * Always work in due-date order.
   * This becomes the canonical bill list for UI.
   */
  const bills = useMemo(() => {
    return [...state.bills].sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate)
    );
  }, [state.bills]);

  const essentials = useMemo(
    () => bills.filter((b) => b.isEssential),
    [bills]
  );

  const optional = useMemo(
    () => bills.filter((b) => !b.isEssential),
    [bills]
  );

  /**
   * Stable action refs (important for performance in lists & memoized screens)
   */
  const actions = useMemo(
    () => ({
      addBill: billStore.addBill,
      updateBill: billStore.updateBill,
      deleteBill: billStore.deleteBill,
      getBillById: billStore.getBillById,

      addIncome: billStore.addIncome,
      updateIncome: billStore.updateIncome,
      deleteIncome: billStore.deleteIncome,

      setAccounts: billStore.setAccounts,
    }),
    []
  );

  return {
    accounts: state.accounts,
    income: state.income,

    // ✅ Canonical ordered bills for UI
    bills,
    essentials,
    optional,

    ...actions,
  };
}
