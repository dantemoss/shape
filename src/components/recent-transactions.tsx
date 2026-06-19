"use client";

import { Transaction, CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="border border-border rounded-xl p-5 bg-card">
      <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
        Últimos movimientos
      </h2>
      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Sin movimientos</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                    tx.type === "income"
                      ? "bg-income/15 text-income"
                      : "bg-expense/15 text-expense"
                  )}
                >
                  {tx.type === "income" ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {format(new Date(tx.date), "d MMM · HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "text-sm font-mono font-medium shrink-0",
                  tx.type === "income" ? "text-income" : "text-expense"
                )}
              >
                {tx.type === "expense" ? "-" : "+"}${tx.amount.toLocaleString("es-AR")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
