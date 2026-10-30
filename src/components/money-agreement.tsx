"use client";

import { formatPesos } from "@/lib/money";
import { useMoneySnapshot } from "@/lib/use-money";
import { cn } from "@/lib/utils";

/** Los mismos tres números en el dashboard, Movimientos e Higiene. */
export function MoneyAgreement({ className, showSaldo = true }: { className?: string; showSaldo?: boolean }) {
  const snapshot = useMoneySnapshot();
  const saldo = snapshot.account.hasBaseline ? formatPesos(snapshot.account.balance) : "sin cargar";

  return (
    <div className={cn("grid grid-cols-1 gap-3", showSaldo ? "min-[420px]:grid-cols-3" : "min-[420px]:grid-cols-2", className)}>
      {showSaldo && (
        <figure className="min-w-0">
          <figcaption className="text-[12px] text-[#9aa1ab]">Saldo real</figcaption>
          <span className={cn("mt-0.5 block truncate text-[15px] font-semibold tabular-nums", snapshot.account.balance < 0 && "text-expense")}>
            {saldo}
          </span>
        </figure>
      )}
      <figure className="min-w-0">
        <figcaption className="text-[12px] text-[#9aa1ab]">Ingresos del mes</figcaption>
        <span className="mt-0.5 block truncate text-[15px] font-semibold text-income tabular-nums">{formatPesos(snapshot.calendarMonth.income)}</span>
      </figure>
      <figure className="min-w-0">
        <figcaption className="text-[12px] text-[#9aa1ab]">Gastos del mes</figcaption>
        <span className="mt-0.5 block truncate text-[15px] font-semibold text-expense tabular-nums">{formatPesos(snapshot.calendarMonth.expense)}</span>
      </figure>
      {(snapshot.usd.income > 0 || snapshot.usd.expense > 0) && (
        <p className="col-span-full text-[12px] text-[#8b919c]">
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
