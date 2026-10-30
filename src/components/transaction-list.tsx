"use client";

import { useRef, useState } from "react";
import { Transaction, CATEGORY_LABELS, RECURRENCE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Trash2, ArrowDownLeft, ArrowUpRight, CreditCard } from "lucide-react";
import { iconWell } from "@/components/viz/ui";
import { cn } from "@/lib/utils";
import { dayHeading } from "@/lib/format-date";
import { formatMoney, isArs } from "@/lib/money";

interface TransactionListProps {
  transactions: Transaction[];
  onRemove: (id: string) => void;
}

type Filter = "all" | "income" | "expense";

function formatDayLabel(dateStr: string): string {
  return dayHeading(dateStr);
}

export function TransactionList({ transactions, onRemove }: TransactionListProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmRef = useRef<string | null>(null);

  const filtered = filter === "all"
    ? transactions
    : transactions.filter((t) => t.type === filter);

  const grouped = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const key = tx.date.slice(0, 10);
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

  function armRemove(id: string) {
    if (confirmRef.current === id) {
      confirmRef.current = null;
      setConfirmId(null);
      onRemove(id);
      return;
    }
    confirmRef.current = id;
    setConfirmId(id);
    window.setTimeout(() => {
      if (confirmRef.current !== id) return;
      confirmRef.current = null;
      setConfirmId(null);
    }, 4000);
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
            const dayArs = dayTx.filter((t) => isArs(t.currency) && t.countsInBalance !== false);
            const dayIncome = dayArs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
            const dayExpense = dayArs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
            const dayNet = dayIncome - dayExpense;
            const hasUsd = dayTx.some((t) => !isArs(t.currency));

            return (
              <div key={day}>
                {/* ── Encabezado del día ── */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-medium tracking-wide text-muted-foreground">
                    {formatDayLabel(day)}
                  </span>
                  <span className={cn(
                    "shrink-0 text-xs font-medium tabular-nums",
                    dayNet > 0 ? "text-income" : dayNet < 0 ? "text-expense" : "text-muted-foreground"
                  )}>
                    {dayIncome === 0 && dayExpense === 0 && hasUsd
                      ? "USD aparte"
                      : `${dayNet >= 0 ? "+" : "−"}$${Math.abs(dayNet).toLocaleString("es-AR")}${hasUsd ? " · USD aparte" : ""}`}
                  </span>
                </div>

                {/* ── Ítems ── */}
                <div className="rounded-2xl border border-border overflow-hidden bg-card divide-y divide-border">
                  {dayTx.map((tx) => {
                    const isConfirming = confirmId === tx.id;
                    return (
                      <div
                        key={tx.id}
                        className="group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-muted/30 active:bg-muted/50"
                      >
                        {/* Ícono */}
                        <div className={iconWell}>
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
                            {tx.kind === "salary" && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                Sueldo
                              </Badge>
                            )}
                            {tx.countsInBalance === false && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                no suma
                              </Badge>
                            )}
                            {tx.currency === "USD" && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                USD
                              </Badge>
                            )}
                            {tx.merchant && tx.merchant !== tx.description && (
                              <span className="text-xs text-muted-foreground truncate">{tx.merchant}</span>
                            )}
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
                          {tx.type === "expense" ? "−" : "+"}
                          {formatMoney(Math.abs(tx.amount), tx.currency)}
                        </span>

                        {isConfirming ? (
                          <button
                            type="button"
                            onClick={() => {
                              confirmRef.current = null;
                              setConfirmId(null);
                              onRemove(tx.id);
                            }}
                            className="shrink-0 rounded-full bg-expense px-2.5 py-1 text-xs font-medium text-white"
                          >
                            Borrar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => armRemove(tx.id)}
                            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-[#f4f5f7] text-[#1c1f26] hover:bg-white"
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
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
