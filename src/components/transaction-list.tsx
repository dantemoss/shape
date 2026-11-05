"use client";

import { useRef, useState } from "react";
import { Transaction, CATEGORY_LABELS, RECURRENCE_LABELS } from "@/lib/types";
import { Trash2, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CreditCard } from "lucide-react";
import { iconWell } from "@/components/viz/ui";
import { Amount, EmptyState, IconWell, SegmentedControl } from "@/components/primitives";
import { cn } from "@/lib/utils";
import { dayHeading } from "@/lib/format-date";
import { isArs } from "@/lib/money";
import type { ReactNode } from "react";

interface TransactionListProps {
  transactions: Transaction[];
  onRemove: (id: string) => void;
}

type Filter = "all" | "income" | "expense";

function formatDayLabel(dateStr: string): string {
  return dayHeading(dateStr);
}

function MovementMeta({ tx }: { tx: Transaction }) {
  const bits: ReactNode[] = [CATEGORY_LABELS[tx.category]];
  if (tx.kind === "salary") bits.push("Sueldo");
  if (tx.countsInBalance === false) bits.push("no suma");
  if (tx.currency === "USD") bits.push("USD");
  if (tx.merchant && tx.merchant !== tx.description) bits.push(tx.merchant);
  if (tx.recurrence !== "once") bits.push(RECURRENCE_LABELS[tx.recurrence]);
  if (tx.hasInstallments) {
    bits.push(
      <span className="inline-flex items-center gap-1">
        <CreditCard size={11} aria-hidden />
        {tx.currentInstallment}/{tx.totalInstallments}
      </span>
    );
  }

  return (
    <p className="mt-0.5 flex min-w-0 flex-wrap items-center text-xs text-muted-foreground">
      {bits.map((bit, index) => (
        <span key={index} className="inline-flex min-w-0 items-center">
          {index > 0 ? (
            <span className="px-1 text-[#b0b6bf]" aria-hidden>
              ·
            </span>
          ) : null}
          {bit}
        </span>
      ))}
    </p>
  );
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
      <SegmentedControl
        label="Filtrar movimientos"
        value={filter}
        onChange={setFilter}
        options={FILTER_OPTIONS}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={
            <IconWell size="lg" className="size-12">
              <ArrowLeftRight size={20} strokeWidth={1.75} />
            </IconWell>
          }
          title="Sin movimientos"
        >
          Agregá uno con el botón de arriba
        </EmptyState>
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
                          <MovementMeta tx={tx} />
                        </div>

                        <Amount
                          className="shrink-0"
                          value={tx.amount}
                          currency={tx.currency}
                          size="secondary"
                          signed
                          tone={tx.type === "income" ? "income" : "expense"}
                        />

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
