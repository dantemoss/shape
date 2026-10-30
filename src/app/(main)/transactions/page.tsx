"use client";

import { useState } from "react";
import { useShapeStore } from "@/lib/store";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionList } from "@/components/transaction-list";
import { MoneyAgreement } from "@/components/money-agreement";
import { formatPesos } from "@/lib/money";
import { useMoneySnapshot } from "@/lib/use-money";
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
  const snapshot = useMoneySnapshot();

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <div className="page-head !block">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-medium">Movimientos</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
              <Button className="gap-2" />
            }>
              <Plus size={14} />
              Nuevo movimiento
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
        <div className="px-4 sm:px-8 pb-3 sm:pb-4 sm:pt-0 space-y-2">
          <MoneyAgreement />
          <p className="text-[13px] leading-relaxed break-words text-[#8b919c]">
            Histórico en pesos: +{formatPesos(snapshot.allTimeArs.income)} −{formatPesos(snapshot.allTimeArs.expense)}
            {" · "}
            {transactions.length} movimiento{transactions.length !== 1 ? "s" : ""}
            {(snapshot.usd.income > 0 || snapshot.usd.expense > 0) && " · los dólares no se suman a los pesos"}
          </p>
        </div>
      </div>

      {/* ── Lista ── */}
      <div className="flex-1 px-4 sm:px-8 py-5">
        <TransactionList transactions={transactions} onRemove={removeTransaction} />
      </div>
    </div>
  );
}
