"use client";

import { Amount, Stat, StatRow } from "@/components/primitives";
import { useMoneySnapshot } from "@/lib/use-money";
/** Los mismos tres números en el dashboard, Movimientos e Higiene. */
export function MoneyAgreement({ className, showSaldo = true }: { className?: string; showSaldo?: boolean }) {
  const snapshot = useMoneySnapshot();

  return (
    <div className={className}>
      <StatRow columns={showSaldo ? 3 : 2}>
        {showSaldo ? (
          <Stat
            label="Saldo real"
            value={
              snapshot.account.hasBaseline ? (
                <Amount value={snapshot.account.balance} tone={snapshot.account.balance < 0 ? "expense" : "neutral"} animate />
              ) : (
                "Sin cargar"
              )
            }
          />
        ) : null}
        <Stat label="Ingresos del mes" value={<Amount value={snapshot.calendarMonth.income} tone="income" />} />
        <Stat label="Gastos del mes" value={<Amount value={snapshot.calendarMonth.expense} tone="expense" />} />
      </StatRow>
      {(snapshot.usd.income > 0 || snapshot.usd.expense > 0) && (
        <p className="mt-3 text-[13px] text-[#8b919c]">
          USD aparte {formatUsd(snapshot.usd.income, snapshot.usd.expense)}. No entra al saldo.
        </p>
      )}
    </div>
  );
}

function formatUsd(income: number, expense: number): string {
  const parts: string[] = [];
  if (income > 0) parts.push(`+US$${income.toLocaleString("es-AR")}`);
  if (expense > 0) parts.push(`−US$${expense.toLocaleString("es-AR")}`);
  return parts.join(" ");
}
