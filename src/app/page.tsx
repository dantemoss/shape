"use client";

import { useState, useMemo } from "react";
import { useShapeStore } from "@/lib/store";
import { BalanceCard } from "@/components/balance-card";
import { IncomeExpenseChart } from "@/components/income-expense-chart";
import { RecentTransactions } from "@/components/recent-transactions";
import { GoalsMini } from "@/components/goals-mini";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transaction-form";
import { getMonthComparison } from "@/lib/health-utils";

type Period = "month" | "3m" | "6m" | "year";

const PERIOD_LABELS: Record<Period, string> = {
  month: "Este mes",
  "3m": "3 meses",
  "6m": "6 meses",
  year: "Este año",
};

function filterByPeriod(transactions: ReturnType<typeof useShapeStore.getState>["transactions"], period: Period) {
  const now = new Date();
  let cutoff: Date;

  switch (period) {
    case "month":
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "3m":
      cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      break;
    case "6m":
      cutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      break;
    case "year":
      cutoff = new Date(now.getFullYear(), 0, 1);
      break;
  }

  return transactions.filter((t) => new Date(t.date) >= cutoff);
}

function buildChartData(transactions: ReturnType<typeof useShapeStore.getState>["transactions"], period: Period) {
  const filtered = filterByPeriod(transactions, period);
  const months: Record<string, { income: number; expenses: number }> = {};

  filtered.forEach((t) => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!months[key]) months[key] = { income: 0, expenses: 0 };
    if (t.type === "income") months[key].income += t.amount;
    else months[key].expenses += t.amount;
  });

  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => {
      const [year, month] = key.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return {
        month: date.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
        ...data,
      };
    });
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [newTxOpen, setNewTxOpen] = useState(false);

  const allTransactions = useShapeStore((s) => s.transactions);
  const goals = useShapeStore((s) => s.goals);
  const salaryConfig = useShapeStore((s) => s.salaryConfig);

  const filtered = useMemo(() => filterByPeriod(allTransactions, period), [allTransactions, period]);
  const chartData = useMemo(() => buildChartData(allTransactions, period), [allTransactions, period]);
  const monthComp = useMemo(() => getMonthComparison(allTransactions), [allTransactions]);

  const salary = salaryConfig?.amount ?? 0;
  const totalExpenses = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = salary - totalExpenses;
  const balancePercent = salary > 0 ? ((balance / salary) * 100) : 0;
  const expensePercent = salary > 0 ? Math.min((totalExpenses / salary) * 100, 100) : 0;

  const greeting = getGreeting();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border px-8 py-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{greeting}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={newTxOpen} onOpenChange={setNewTxOpen}>
            <DialogTrigger render={<Button size="sm" className="gap-2" />}>
              <Plus size={14} />
              Nuevo movimiento
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo movimiento</DialogTitle>
              </DialogHeader>
              <TransactionForm onSuccess={() => setNewTxOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Period filter */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 w-fit border border-border">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                period === p
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-5 gap-5">
          {/* Left 3 cols */}
          <div className="col-span-3 space-y-5">
            {/* Balance cards */}
            <div className="grid grid-cols-2 gap-5">
              <BalanceCard
                title="Balance disponible"
                subtitle="Sueldo menos gastos"
                value={balance}
                percentage={Math.max(balancePercent, 0)}
                changePercent={monthComp.previous > 0 ? -monthComp.changePercent : undefined}
                color={balance >= 0 ? "income" : "expense"}
                href="/health"
              />
              <BalanceCard
                title={salaryConfig?.label ?? "Sueldo"}
                subtitle="Monto de cobro"
                value={salary}
                percentage={expensePercent}
                color="neutral"
                href="/salary"
                empty={!salaryConfig}
                emptyHint="Configurar sueldo →"
              />
            </div>

            {/* Chart */}
            <IncomeExpenseChart data={chartData} />
          </div>

          {/* Right 2 cols */}
          <div className="col-span-2 space-y-5">
            <RecentTransactions transactions={allTransactions.slice(0, 7)} />
            {goals.length > 0 && <GoalsMini goals={goals} />}
          </div>
        </div>

        {allTransactions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl">
            <p className="text-sm">Sin movimientos todavía.</p>
            <p className="text-xs mt-1">
              Usá el botón "Nuevo movimiento" para empezar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días 👋";
  if (hour < 19) return "Buenas tardes 👋";
  return "Buenas noches 👋";
}
