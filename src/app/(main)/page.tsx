"use client";

import { useState, useMemo } from "react";
import { useShapeStore } from "@/lib/store";
import { getMonthComparison, getCategoryBreakdown } from "@/lib/health-utils";
import { TransactionForm } from "@/components/transaction-form";
import { Button } from "@/components/ui/button";
import {
  Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  Wallet, Filter, Target, HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { getNextPaymentDate } from "@/lib/salary-utils";
import { CATEGORY_LABELS, type ExpenseCategory } from "@/lib/types";

type Period = "month" | "3m" | "6m" | "year";

const PERIOD_LABELS: Record<Period, string> = {
  month: "Este mes", "3m": "3 meses", "6m": "6 meses", year: "Año",
};

const INCOME_COLOR = "oklch(0.55 0.15 162)";
const EXPENSE_COLOR = "oklch(0.577 0.245 27.325)";

function filterByPeriod(
  transactions: ReturnType<typeof useShapeStore.getState>["transactions"],
  period: Period
) {
  const now = new Date();
  const cutoffs: Record<Period, Date> = {
    month: new Date(now.getFullYear(), now.getMonth(), 1),
    "3m": new Date(now.getFullYear(), now.getMonth() - 2, 1),
    "6m": new Date(now.getFullYear(), now.getMonth() - 5, 1),
    year: new Date(now.getFullYear(), 0, 1),
  };
  return transactions.filter((t) => new Date(t.date) >= cutoffs[period]);
}

function buildGroupedChartData(
  transactions: ReturnType<typeof useShapeStore.getState>["transactions"],
  period: Period
) {
  const filtered = filterByPeriod(transactions, period);
  const months: Record<string, { income: number; expense: number }> = {};
  filtered.forEach((t) => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!months[key]) months[key] = { income: 0, expense: 0 };
    months[key][t.type === "income" ? "income" : "expense"] += t.amount;
  });
  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => {
      const [year, month] = key.split("-");
      return {
        month: new Date(parseInt(year), parseInt(month) - 1)
          .toLocaleDateString("es-AR", { month: "short" }),
        ...vals,
      };
    });
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs shadow-xl">
      <p className="text-muted-foreground font-mono mb-2 font-medium uppercase tracking-wider">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill }} />
          <span className="text-muted-foreground">{p.dataKey === "income" ? "Ingresos" : "Gastos"}:</span>
          <span className="font-semibold font-mono">${p.value.toLocaleString("es-AR")}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
          <div className="w-2 h-2 rounded-full shrink-0 bg-foreground/20" />
          <span className="text-muted-foreground">Neto:</span>
          <span className={cn("font-semibold font-mono", (payload[0].value - payload[1].value) >= 0 ? "text-income" : "text-expense")}>
            ${Math.abs(payload[0].value - payload[1].value).toLocaleString("es-AR")}
          </span>
        </div>
      )}
    </div>
  );
}

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">{payload[0].name}</p>
      <p className="font-mono text-expense">${payload[0].value.toLocaleString("es-AR")}</p>
    </div>
  );
}

const CATEGORY_COLORS = [
  "oklch(0.577 0.245 27.325)",
  "oklch(0.62 0.22 35)",
  "oklch(0.65 0.18 45)",
  "oklch(0.68 0.14 55)",
  "oklch(0.70 0.10 65)",
];

function SpendingRing({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(pct / 100, 1) * circ;
  const color = pct >= 90 ? EXPENSE_COLOR : pct >= 70 ? "oklch(0.70 0.18 55)" : INCOME_COLOR;
  return (
    <svg width={72} height={72} viewBox="0 0 72 72" className="-rotate-90">
      <circle cx={36} cy={36} r={r} fill="none" stroke="oklch(0.92 0 0)" strokeWidth={6} />
      <circle
        cx={36} cy={36} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  return `${saludo}, ${name}`;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [newTxOpen, setNewTxOpen] = useState(false);

  const allTx = useShapeStore((s) => s.transactions);
  const goals = useShapeStore((s) => s.goals);
  const salaryConfig = useShapeStore((s) => s.salaryConfig);
  const userProfile = useShapeStore((s) => s.userProfile);

  const filtered = useMemo(() => filterByPeriod(allTx, period), [allTx, period]);
  const chartData = useMemo(() => buildGroupedChartData(allTx, period), [allTx, period]);
  const monthComp = useMemo(() => getMonthComparison(allTx), [allTx]);

  const salary = salaryConfig?.amount ?? 0;
  const totalExpenses = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const balance = salary > 0 ? salary - totalExpenses : totalIncome - totalExpenses;
  const spendPct = salary > 0 ? Math.round((totalExpenses / salary) * 100) : 0;
  const changePercent = monthComp.previous > 0 ? -monthComp.changePercent : null;

  const catBreakdown = useMemo(() => getCategoryBreakdown(filtered, salary), [filtered, salary]);
  const topCats = catBreakdown.slice(0, 5);
  const pieData = topCats.map((c) => ({
    name: CATEGORY_LABELS[c.category as ExpenseCategory] ?? c.category,
    value: c.amount,
  }));

  const recentTx = allTx.slice(0, 8);
  const nextPayment = salaryConfig ? getNextPaymentDate(salaryConfig) : null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-border bg-background sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-medium">
            {userProfile ? getGreeting(userProfile.name) : "Dashboard"}
          </h1>
          <p className="text-xs text-muted-foreground font-mono capitalize">
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={newTxOpen} onOpenChange={setNewTxOpen}>
            <DialogTrigger render={<Button className="gap-2" />}>
              <Plus size={14} />
              Nuevo movimiento
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Nuevo movimiento</DialogTitle></DialogHeader>
              <TransactionForm onSuccess={() => setNewTxOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex flex-1">
        {/* ── Main ── */}
        <div className="flex-1 p-6 space-y-5 min-w-0">

          {/* ── Wallet Card ── */}
          <div className="border border-border rounded-2xl p-5 bg-card">
            <div className="flex items-start justify-between gap-4">
              {/* Left: balance info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-income/10 flex items-center justify-center shrink-0">
                    <Wallet size={13} className="text-income" />
                  </div>
                  <span className="font-medium text-sm">Mi Balance</span>
                  <Link href="/transactions">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground ml-1">
                      Ver todo →
                    </Button>
                  </Link>
                </div>

                <div className="flex items-end gap-3 mb-4">
                  <p className={cn("text-4xl font-medium tabular-nums tracking-tight", balance >= 0 ? "text-foreground" : "text-expense")}>
                    $<NumberFlow value={balance} locales="es-AR" format={{ maximumFractionDigits: 0 }} />
                  </p>
                  {changePercent !== null && (
                    <span className={cn(
                      "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full mb-1 shrink-0",
                      changePercent >= 0 ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
                    )}>
                      {changePercent >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {changePercent >= 0 ? "+" : ""}{Math.round(changePercent)}% vs mes ant.
                    </span>
                  )}
                </div>

                {/* 3 métricas */}
                <div className="grid grid-cols-3 divide-x divide-border">
                  <div className="pr-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-1">Balance</p>
                    <p className={cn("text-base font-medium tabular-nums font-mono", balance >= 0 ? "" : "text-expense")}>
                      ${Math.abs(balance).toLocaleString("es-AR")}
                    </p>
                  </div>
                  <div className="px-4">
                    <p className="text-[10px] text-income uppercase tracking-wider font-mono mb-1">Sueldo</p>
                    {salary > 0 ? (
                      <p className="text-base font-medium tabular-nums font-mono text-income">
                        ${salary.toLocaleString("es-AR")}
                      </p>
                    ) : (
                      <Link href="/salary" className="text-xs text-muted-foreground underline underline-offset-4 decoration-dashed">
                        Configurar
                      </Link>
                    )}
                  </div>
                  <div className="pl-4">
                    <p className="text-[10px] text-expense uppercase tracking-wider font-mono mb-1">Gastos</p>
                    <p className="text-base font-medium tabular-nums font-mono text-expense">
                      ${totalExpenses.toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: spending ring */}
              {salary > 0 && (
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <div className="relative">
                    <SpendingRing pct={spendPct} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={cn(
                        "text-sm font-bold tabular-nums",
                        spendPct >= 90 ? "text-expense" : spendPct >= 70 ? "text-yellow-600" : "text-income"
                      )}>
                        {spendPct}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono text-center leading-tight">
                    gastado<br />del sueldo
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Gráficos: Cash Flow + Categorías ── */}
          <div className="grid grid-cols-5 gap-5">
            {/* Cash Flow (barras dobles) */}
            <div className="col-span-3 border border-border rounded-2xl p-5 bg-card">
              {/* Fila 1: título + monto */}
              <div className="mb-3">
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Cash Flow</p>
                <p className="text-xl font-medium mt-0.5">
                  ${(totalIncome - totalExpenses >= 0 ? totalIncome - totalExpenses : totalExpenses - totalIncome).toLocaleString("es-AR")}
                  <span className={cn("text-xs font-medium ml-2", totalIncome >= totalExpenses ? "text-income" : "text-expense")}>
                    {totalIncome >= totalExpenses ? "superávit" : "déficit"}
                  </span>
                </p>
              </div>

              {/* Fila 2: período selector — fila propia con todo el ancho */}
              <div className="flex items-center gap-1.5 bg-muted/50 rounded-xl p-1 border border-border mb-4 w-fit">
                {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                      period === p
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                    )}
                  >
                    {PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>

              {/* Leyenda */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: INCOME_COLOR }} />
                  Ingresos
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: EXPENSE_COLOR }} />
                  Gastos
                </div>
              </div>

              {chartData.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                  Sin datos para este período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} barCategoryGap="25%" barGap={2}>
                    <CartesianGrid vertical={false} stroke="oklch(0.92 0 0)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", fill: "oklch(0.55 0 0)" }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", fill: "oklch(0.55 0 0)" }}
                      axisLine={false} tickLine={false}
                      tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      width={40}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "oklch(0.96 0 0)", radius: 4 }} />
                    <Bar dataKey="income" radius={[3, 3, 0, 0]} fill={INCOME_COLOR} />
                    <Bar dataKey="expense" radius={[3, 3, 0, 0]} fill={EXPENSE_COLOR} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Breakdown categorías */}
            <div className="col-span-2 border border-border rounded-2xl p-5 bg-card flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Por categoría</p>
                <Link href="/health" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors font-mono">
                  Ver análisis →
                </Link>
              </div>

              {topCats.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs text-center">
                  Sin gastos en este período
                </div>
              ) : (
                <>
                  {/* Mini donut */}
                  <div className="flex justify-center mb-3">
                    <div className="relative w-[90px] h-[90px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%" cy="50%"
                            innerRadius={28} outerRadius={42}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Lista */}
                  <div className="space-y-2 flex-1">
                    {topCats.map((c, i) => {
                      const pct = totalExpenses > 0 ? Math.round((c.amount / totalExpenses) * 100) : 0;
                      return (
                        <div key={c.category}>
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                              />
                              <span className="text-xs truncate text-muted-foreground">
                                {CATEGORY_LABELS[c.category as ExpenseCategory] ?? c.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-[10px] text-muted-foreground font-mono">{pct}%</span>
                              <span className="text-xs font-mono font-semibold text-expense">
                                ${c.amount.toLocaleString("es-AR")}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-border rounded-full h-[3px]">
                            <div
                              className="h-[3px] rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Transacciones recientes ── */}
          <div className="border border-border rounded-2xl bg-card">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <p className="font-medium text-sm">Transacciones recientes</p>
              <Link href="/transactions">
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-7">
                  <Filter size={11} />
                  Ver todo
                </Button>
              </Link>
            </div>
            {recentTx.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Sin movimientos todavía
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentTx.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3.5 px-5 py-2.5 hover:bg-muted/30 transition-colors">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                      tx.type === "income" ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
                    )}>
                      {tx.type === "income" ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">{tx.description}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {CATEGORY_LABELS[tx.category]} · {format(new Date(tx.date), "d MMM", { locale: es })}
                      </p>
                    </div>
                    <span className={cn("text-sm font-mono font-semibold shrink-0", tx.type === "income" ? "text-income" : "text-expense")}>
                      {tx.type === "expense" ? "-" : "+"}${tx.amount.toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="w-[268px] shrink-0 border-l border-border p-4 space-y-4 sticky top-[61px] h-[calc(100vh-61px)] overflow-y-auto">

          {/* Próximo cobro */}
          {salaryConfig && nextPayment ? (
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Próximo cobro</p>
              <Link href="/salary">
                <div className="border border-border rounded-xl p-4 bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[130px]">{salaryConfig.label}</p>
                      <p className="text-lg font-medium font-mono text-income mt-0.5">
                        ${salaryConfig.amount.toLocaleString("es-AR")}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full font-mono shrink-0",
                      nextPayment.isToday
                        ? "bg-income text-income-foreground"
                        : nextPayment.daysLeft <= 3
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-muted text-muted-foreground"
                    )}>
                      {nextPayment.isToday ? "¡Hoy!" : `${nextPayment.daysLeft}d`}
                    </span>
                  </div>

                  {/* Barra de días */}
                  <div className="flex gap-[2px] mb-1.5">
                    {Array.from({ length: 20 }).map((_, i) => {
                      const totalDays = salaryConfig.frequency === "weekly" ? 7 : salaryConfig.frequency === "biweekly" ? 15 : 30;
                      const filled = Math.round(((totalDays - nextPayment.daysLeft) / totalDays) * 20);
                      return (
                        <div key={i} className={cn("flex-1 h-1.5 rounded-full", i < filled ? "bg-income" : "bg-border")} />
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {format(nextPayment.date, "d 'de' MMMM", { locale: es })}
                  </p>
                </div>
              </Link>
            </div>
          ) : !salaryConfig && (
            <div className="border border-income/30 rounded-xl p-3.5 bg-income/5">
              <p className="text-sm font-medium text-income mb-1">Configurá tu sueldo</p>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Agregá tu sueldo para ver tu balance real y cuándo cobrás.
              </p>
              <Link href="/salary">
                <Button variant="income" size="sm" className="w-full">
                  Configurar ahora
                </Button>
              </Link>
            </div>
          )}

          {/* Metas */}
          {goals.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Metas</p>
                <Link href="/goals" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors font-mono">
                  Ver todo →
                </Link>
              </div>
              <div className="space-y-2">
                {goals.slice(0, 3).map((goal) => {
                  const pct = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
                  return (
                    <div key={goal.id} className="border border-border rounded-xl p-3 bg-card">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium truncate">{goal.name}</p>
                        <span className="text-[10px] font-mono text-muted-foreground ml-2 shrink-0">{pct}%</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-1 mb-1.5">
                        <div
                          className="h-1 rounded-full bg-income transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                        <span className="text-income">${goal.currentAmount.toLocaleString("es-AR")}</span>
                        <span>${goal.targetAmount.toLocaleString("es-AR")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Acciones rápidas */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Acciones rápidas</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { href: "/transactions", label: "Movs.", icon: ArrowUpRight },
                { href: "/goals", label: "Metas", icon: Target },
                { href: "/health", label: "Higiene", icon: HeartPulse },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <div className="border border-border rounded-xl p-2.5 flex flex-col items-center gap-1.5 hover:bg-muted/40 transition-colors text-center">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <Icon size={12} className="text-muted-foreground" />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium leading-none">{label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
