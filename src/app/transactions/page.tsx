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

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border px-8 py-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Movimientos</h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm text-income font-mono font-medium">
              +${totalIncome.toLocaleString("es-AR")} ingresos
            </span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-sm text-expense font-mono font-medium">
              -${totalExpenses.toLocaleString("es-AR")} gastos
            </span>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" className="gap-2" />}>
            <Plus size={14} />
            Nuevo
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo movimiento</DialogTitle>
            </DialogHeader>
            <TransactionForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-8 py-6">
        <TransactionList transactions={transactions} onRemove={removeTransaction} />
      </div>
    </div>
  );
}
