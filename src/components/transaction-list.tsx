"use client";

import { useState } from "react";
import { Transaction, CATEGORY_LABELS, RECURRENCE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowDownLeft, ArrowUpRight, CreditCard, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TransactionListProps {
  transactions: Transaction[];
  onRemove: (id: string) => void;
}

type Filter = "all" | "income" | "expense";

export function TransactionList({ transactions, onRemove }: TransactionListProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  // Group by date
  const grouped = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const key = format(new Date(tx.date), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const FILTER_OPTIONS: { value: Filter; label: string }[] = [
    { value: "all", label: "Todo" },
    { value: "income", label: "Ingresos" },
    { value: "expense", label: "Gastos" },
  ];

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="flex gap-1 border border-border rounded-lg p-1 w-fit bg-muted/40">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
              filter === value
                ? value === "income"
                  ? "bg-income text-income-foreground shadow-sm"
                  : value === "expense"
                  ? "bg-expense text-expense-foreground shadow-sm"
                  : "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista agrupada por fecha */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Sin movimientos</div>
      ) : (
        <div className="space-y-6">
          {sortedDays.map((day) => {
            const dayTotal = grouped[day].reduce(
              (sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount),
              0
            );
            return (
              <div key={day}>
                {/* Encabezado del día */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    <span className="font-mono">
                      {format(new Date(day), "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-mono font-medium",
                      dayTotal >= 0 ? "text-income" : "text-expense"
                    )}
                  >
                    {dayTotal >= 0 ? "+" : ""}${Math.abs(dayTotal).toLocaleString("es-AR")}
                  </span>
                </div>

                {/* Transacciones del día */}
                <div className="space-y-2">
                  {grouped[day].map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-muted/30 transition-all duration-150 group bg-card"
                    >
                      {/* Ícono */}
                      <div
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                          tx.type === "income"
                            ? "bg-income/15 text-income"
                            : "bg-expense/15 text-expense"
                        )}
                      >
                        {tx.type === "income" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{tx.description}</p>
                          {tx.recurrence !== "once" && (
                            <Badge variant="secondary" className="text-xs">
                              {RECURRENCE_LABELS[tx.recurrence]}
                            </Badge>
                          )}
                          {tx.hasInstallments && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <CreditCard size={10} />
                              {tx.currentInstallment}/{tx.totalInstallments}
                              {tx.cardName && ` · ${tx.cardName}`}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {CATEGORY_LABELS[tx.category]}
                        </p>
                      </div>

                      {/* Monto */}
                      <span
                        className={cn(
                          "text-sm font-mono font-medium shrink-0",
                          tx.type === "income" ? "text-income" : "text-expense"
                        )}
                      >
                        {tx.type === "expense" ? "-" : "+"}$
                        {tx.amount.toLocaleString("es-AR")}
                      </span>

                      {/* Eliminar */}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-expense"
                        onClick={() => onRemove(tx.id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
