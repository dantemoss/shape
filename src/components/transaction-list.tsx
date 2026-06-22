"use client";

import { useState } from "react";
import { Transaction, CATEGORY_LABELS, RECURRENCE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Trash2, ArrowDownLeft, ArrowUpRight, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";

interface TransactionListProps {
  transactions: Transaction[];
  onRemove: (id: string) => void;
}

type Filter = "all" | "income" | "expense";

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d))     return "Hoy";
  if (isYesterday(d)) return "Ayer";
  return format(d, "EEEE d 'de' MMMM", { locale: es });
}

export function TransactionList({ transactions, onRemove }: TransactionListProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = filter === "all"
    ? transactions
    : transactions.filter((t) => t.type === filter);

  const grouped = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const key = format(new Date(tx.date), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const FILTER_OPTIONS: { value: Filter; label: string }[] = [
    { value: "all",     label: "Todo" },
    { value: "income",  label: "Ingresos" },
    { value: "expense", label: "Gastos" },
  ];

  function handleRemove(id: string) {
    if (confirmId === id) {
      onRemove(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 2500);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Filtros ── */}
      <div className="flex gap-1.5 border border-border rounded-xl p-1 w-fit bg-muted/40">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap",
              filter === value
                ? value === "income"
                  ? "bg-income text-income-foreground shadow-sm"
                  : value === "expense"
                  ? "bg-expense text-white shadow-sm"
                  : "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Lista ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
          <p className="text-3xl mb-3">💸</p>
          <p className="text-sm font-medium">Sin movimientos</p>
          <p className="text-xs mt-1">Agregá uno con el botón de arriba</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDays.map((day) => {
            const dayTx = grouped[day];
            const dayIncome  = dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
            const dayExpense = dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
            const dayNet     = dayIncome - dayExpense;

            return (
              <div key={day}>
                {/* ── Encabezado del día ── */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-medium text-muted-foreground capitalize tracking-wide">
                    {formatDayLabel(day)}
                  </span>
                  <span className={cn(
                    "text-xs font-mono font-medium",
                    dayNet >= 0 ? "text-income" : "text-expense"
                  )}>
                    {dayNet >= 0 ? "+" : "−"}${Math.abs(dayNet).toLocaleString("es-AR")}
                  </span>
                </div>

                {/* ── Ítems ── */}
                <div className="rounded-2xl border border-border overflow-hidden bg-card divide-y divide-border">
                  {dayTx.map((tx) => {
                    const isConfirming = confirmId === tx.id;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-muted/30 active:bg-muted/50"
                      >
                        {/* Ícono */}
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                          tx.type === "income"
                            ? "bg-income/12 text-income"
                            : "bg-expense/12 text-expense"
                        )}>
                          {tx.type === "income"
                            ? <ArrowDownLeft size={15} />
                            : <ArrowUpRight  size={15} />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug truncate">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {CATEGORY_LABELS[tx.category]}
                            </span>
                            {tx.recurrence !== "once" && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                {RECURRENCE_LABELS[tx.recurrence]}
                              </Badge>
                            )}
                            {tx.hasInstallments && (
                              <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 h-4">
                                <CreditCard size={9} />
                                {tx.currentInstallment}/{tx.totalInstallments}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Monto */}
                        <span className={cn(
                          "text-sm font-mono font-medium shrink-0",
                          tx.type === "income" ? "text-income" : "text-expense"
                        )}>
                          {tx.type === "expense" ? "−" : "+"}$
                          {tx.amount.toLocaleString("es-AR")}
                        </span>

                        {/* Botón eliminar — siempre visible en mobile */}
                        <button
                          onClick={() => handleRemove(tx.id)}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all",
                            isConfirming
                              ? "bg-expense text-white scale-110"
                              : "text-muted-foreground/50 hover:text-expense hover:bg-expense/10 sm:opacity-0 sm:group-hover:opacity-100"
                          )}
                          title={isConfirming ? "Tocá de nuevo para confirmar" : "Eliminar"}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
