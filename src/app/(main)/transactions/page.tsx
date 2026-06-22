"use client";

import { useState } from "react";
import { useShapeStore } from "@/lib/store";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionList } from "@/components/transaction-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TransactionsPage() {
  const [open, setOpen] = useState(false);
  const transactions = useShapeStore((s) => s.transactions);
  const removeTransaction = useShapeStore((s) => s.removeTransaction);

  const totalIncome   = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <div className="border-b border-border sticky top-0 bg-background z-10">
        {/* Fila 1: título + botón */}
        <div className="flex items-center justify-between px-4 sm:px-8 pt-4 pb-2 sm:pb-4 sm:border-b-0">
          <h1 className="text-lg font-medium">Movimientos</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
              <Button size="sm" className="gap-1.5" />
            }>
              <Plus size={14} />
              <span className="hidden sm:inline">Nuevo</span>
              <span className="sm:hidden">Agregar</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo movimiento</DialogTitle>
              </DialogHeader>
              <TransactionForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Fila 2: totales — siempre visible */}
        <div className="flex items-center gap-4 px-4 sm:px-8 pb-3 sm:pb-4 sm:pt-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-income" />
            <span className="text-sm text-income font-mono">
              +${totalIncome.toLocaleString("es-AR")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-expense" />
            <span className="text-sm text-expense font-mono">
              −${totalExpenses.toLocaleString("es-AR")}
            </span>
          </div>
          <div className="h-3 w-px bg-border" />
          <span className="text-xs text-muted-foreground font-mono">
            {transactions.length} movimiento{transactions.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Lista ── */}
      <div className="flex-1 px-4 sm:px-8 py-5">
        <TransactionList transactions={transactions} onRemove={removeTransaction} />
      </div>
    </div>
  );
}
