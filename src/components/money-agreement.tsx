"use client";

import { formatPesos } from "@/lib/money";
import { useMoneySnapshot } from "@/lib/use-money";
import { cn } from "@/lib/utils";

/** Los mismos tres números en el dashboard, Movimientos e Higiene. */
export function MoneyAgreement({ className, showSaldo = true }: { className?: string; showSaldo?: boolean }) {
  const snapshot = useMoneySnapshot();
  const saldo = snapshot.account.hasBaseline ? formatPesos(snapshot.account.balance) : "sin cargar";

  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1", className)}>
      {showSaldo && (
        <figure className="flex items-baseline gap-1.5">
          <figcaption className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            Saldo real
          </figcaption>
          <span className={cn("text-sm font-mono font-medium", snapshot.account.balance < 0 && "text-expense")}>
            {saldo}
          </span>
        </figure>
      )}
      <figure className="flex items-baseline gap-1.5">
        <figcaption className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
          Ingresos del mes
        </figcaption>
        <span className="text-sm font-mono text-income">{formatPesos(snapshot.calendarMonth.income)}</span>
      </figure>
      <figure className="flex items-baseline gap-1.5">
        <figcaption className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
          Gastos del mes
        </figcaption>
        <span className="text-sm font-mono text-expense">{formatPesos(snapshot.calendarMonth.expense)}</span>
      </figure>
      {(snapshot.usd.income > 0 || snapshot.usd.expense > 0) && (
        <p className="text-[11px] text-muted-foreground font-mono">
          USD aparte {formatUsd(snapshot.usd.income, snapshot.usd.expense)}. No entra al saldo.
        </p>
      )}
    </div>
  );
}

function formatUsd(income: number, expense: number): string {
  return `+US$${income.toLocaleString("es-AR")} −US$${expense.toLocaleString("es-AR")}`;
}
