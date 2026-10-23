"use client";

import { useMemo } from "react";
import { buildMoneySnapshot, type MoneySnapshot } from "./money";
import { useShapeStore } from "./store";

export function useMoneySnapshot(): MoneySnapshot {
  const transactions = useShapeStore((s) => s.transactions);
  const adjustments = useShapeStore((s) => s.adjustments);
  const account = useShapeStore((s) => s.account);
  const salaryConfig = useShapeStore((s) => s.salaryConfig);
  const salaryPayments = useShapeStore((s) => s.salaryPayments);

  return useMemo(
    () =>
      buildMoneySnapshot({
        account: account
          ? { startingBalance: account.startingBalance, startingDate: account.startingDate }
          : null,
        transactions,
        adjustments,
        salaryConfig,
        salaryPayments,
      }),
    [account, adjustments, salaryConfig, salaryPayments, transactions]
  );
}
