"use client";

import { useMemo } from "react";
import { useShapeStore } from "@/lib/store";
import {
  getCategoryBreakdown,
  getRecurringExpenses,
  getMonthComparison,
  generateInsights,
} from "@/lib/health-utils";
import { CATEGORY_LABELS, type ExpenseCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { AreaChart } from "@/components/charts/area-chart";
import { Area } from "@/components/charts/area";
import { Grid } from "@/components/charts/grid";
import { XAxis } from "@/components/charts/x-axis";
import { ChartTooltip } from "@/components/charts/tooltip/index";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";

/* ── Config ─────────────────────────────────────────────── */
const INSIGHT_CONFIG = {
  warning: { icon: AlertTriangle, border: "border-expense/20 bg-expense/5", iconColor: "text-expense", titleColor: "text-expense" },
  tip:     { icon: Lightbulb,     border: "border-border bg-muted/40",       iconColor: "text-muted-foreground", titleColor: "text-foreground" },
  positive:{ icon: CheckCircle2,  border: "border-income/20 bg-income/5",    iconColor: "text-income", titleColor: "text-income" },
} as const;

/* ── Helpers ────────────────────────────────────────────── */
function buildMonthlyData(
  transactions: ReturnType<typeof useShapeStore.getState>["transactions"]
) {
  return Array.from({ length: 6 }, (_, i) => {
    const ref      = subMonths(new Date(), 5 - i);
    const interval = { start: startOfMonth(ref), end: endOfMonth(ref) };
    const month    = transactions.filter((t) => isWithinInterval(new Date(t.date), interval));
    return {
      date:      startOfMonth(ref),
      ingresos:  month.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      gastos:    month.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });
}

function calcScore(spendPct: number): number {
  if (spendPct >= 100) return 10;
  if (spendPct >= 90)  return 20;
  if (spendPct >= 80)  return 40;
  if (spendPct >= 70)  return 55;
  if (spendPct >= 60)  return 70;
  if (spendPct >= 50)  return 80;
  return 95;
}
function scoreLabel(s: number) {
  if (s >= 85) return { text: "Excelente", color: "text-income" };
  if (s >= 65) return { text: "Buena",     color: "text-income" };
  if (s >= 45) return { text: "Regular",   color: "text-yellow-600" };
  return            { text: "Crítica",    color: "text-expense" };
}

/* ═══════════════════════════════════════════════════════════ */
export default function HealthPage() {
  const allTx         = useShapeStore((s) => s.transactions);
  const salaryConfig  = useShapeStore((s) => s.salaryConfig);
  const salary        = salaryConfig?.amount ?? 0;

  const monthComp   = useMemo(() => getMonthComparison(allTx), [allTx]);
  const breakdown   = useMemo(() => getCategoryBreakdown(allTx, salary), [allTx, salary]);
  const recurring   = useMemo(() => getRecurringExpenses(allTx), [allTx]);
  const insights    = useMemo(() => generateInsights(allTx, salary), [allTx, salary]);
  const monthlyData = useMemo(() => buildMonthlyData(allTx), [allTx]);

  const thisMonthExpenses = useMemo(() =>
    allTx
      .filter((t) => t.type === "expense" && isWithinInterval(new Date(t.date), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) }))
      .reduce((s, t) => s + t.amount, 0),
    [allTx]
  );

  const spendPct   = salary > 0 ? Math.min(Math.round((thisMonthExpenses / salary) * 100), 100) : 0;
  const score      = allTx.length > 0 ? calcScore(spendPct) : 0;
  const { text: scoreText, color: scoreColor } = scoreLabel(score);
  const topCats    = breakdown.slice(0, 6);
  const hasData    = allTx.length > 0;

  /* Bar chart data */
  const catBarData = topCats.map((c) => ({
    cat:   (CATEGORY_LABELS[c.category as ExpenseCategory] ?? c.category).slice(0, 10),
    monto: c.amount,
  }));

  if (!hasData) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="border-b border-border px-8 py-4 flex items-center gap-4 sticky top-0 bg-background z-10">
          <h1 className="text-lg font-medium">Higiene Financiera</h1>
          <span className="text-sm text-muted-foreground">Análisis de hábitos</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl px-16">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-sm font-medium">Sin datos todavía</p>
            <p className="text-xs mt-1">Registrá movimientos para ver tu análisis</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-8 py-4 flex items-center gap-4 sticky top-0 bg-background z-10">
        <h1 className="text-lg font-medium">Higiene Financiera</h1>
        <span className="text-sm text-muted-foreground">Análisis de hábitos</span>
      </div>

      <div className="flex-1 p-6 space-y-5">

        {/* ── Fila 1: 4 KPIs ── */}
        <div className="grid grid-cols-4 gap-4">

          {/* Score */}
          <div className="border border-border rounded-2xl p-5 bg-card">
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Salud financiera</p>
            <p className={cn("text-4xl font-medium font-mono mt-2", scoreColor)}>{score}</p>
            <p className={cn("text-xs font-medium mt-1", scoreColor)}>{scoreText}</p>
            <div className="mt-3 w-full h-1 bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${score}%`, background: score >= 65 ? "oklch(0.55 0.15 162)" : score >= 45 ? "#d97706" : "oklch(0.577 0.245 27.325)" }} />
            </div>
          </div>

          {/* Gastos del mes */}
          <div className="border border-border rounded-2xl p-5 bg-card">
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Gastos este mes</p>
            <p className="text-3xl font-medium font-mono text-expense mt-2">${thisMonthExpenses.toLocaleString("es-AR")}</p>
            {monthComp.previous > 0 && (
              <div className={cn("flex items-center gap-1 text-xs font-mono mt-2", monthComp.change > 0 ? "text-expense" : "text-income")}>
                {monthComp.change > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {Math.abs(Math.round(monthComp.changePercent))}% vs mes anterior
              </div>
            )}
          </div>

          {/* % sueldo o mes anterior */}
          {salary > 0 ? (
            <div className="border border-border rounded-2xl p-5 bg-card">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Del sueldo gastado</p>
              <p className={cn("text-3xl font-medium font-mono mt-2", spendPct >= 80 ? "text-expense" : spendPct >= 60 ? "text-yellow-600" : "text-income")}>{spendPct}%</p>
              <div className="mt-3 w-full h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${spendPct}%`, background: spendPct >= 80 ? "oklch(0.577 0.245 27.325)" : spendPct >= 60 ? "#d97706" : "oklch(0.55 0.15 162)" }} />
              </div>
            </div>
          ) : (
            <div className="border border-border rounded-2xl p-5 bg-card">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Mes anterior</p>
              <p className="text-3xl font-medium font-mono mt-2">${monthComp.previous.toLocaleString("es-AR")}</p>
            </div>
          )}

          {/* Recurrentes */}
          <div className="border border-border rounded-2xl p-5 bg-card">
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Recurrentes</p>
            <p className="text-3xl font-medium font-mono mt-2">{recurring.length}</p>
            <p className="text-xs text-muted-foreground font-mono mt-2">
              {recurring.length > 0 ? `$${Math.round(recurring.reduce((s, r) => s + r.avgAmount, 0)).toLocaleString("es-AR")} promedio` : "Sin patrones"}
            </p>
          </div>
        </div>

        {/* ── Fila 2: Area chart (tendencia) — ancho completo ── */}
        <div className="border border-border rounded-2xl p-5 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Últimos 6 meses</p>
              <p className="text-sm font-medium mt-0.5">Ingresos vs. Gastos</p>
            </div>
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-1.5 rounded-full bg-income inline-block" />Ingresos</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-1.5 rounded-full bg-expense inline-block" />Gastos</span>
            </div>
          </div>
          <AreaChart
            data={monthlyData}
            xDataKey="date"
            aspectRatio="4/1"
            margin={{ top: 8, right: 8, bottom: 28, left: 52 }}
          >
            <Grid horizontal />
            <Area dataKey="ingresos" fill="oklch(0.55 0.15 162)" />
            <Area dataKey="gastos"   fill="oklch(0.577 0.245 27.325)" />
            <XAxis />
            <ChartTooltip />
          </AreaChart>
        </div>

        {/* ── Fila 3: Bar chart + Insights ── */}
        <div className="grid grid-cols-2 gap-5">

          {/* Bar chart — categorías */}
          {catBarData.length > 0 && (
            <div className="border border-border rounded-2xl p-5 bg-card">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1">Gastos por categoría</p>
              <p className="text-sm font-medium mb-4">Este mes</p>
              <BarChart
                data={catBarData}
                xDataKey="cat"
                aspectRatio="2/1"
                margin={{ top: 8, right: 8, bottom: 32, left: 52 }}
              >
                <Grid horizontal />
                <Bar dataKey="monto" fill="oklch(0.577 0.245 27.325)" lineCap="round" />
                <BarXAxis />
                <ChartTooltip />
              </BarChart>
            </div>
          )}

          {/* Insights */}
          <div className="border border-border rounded-2xl p-5 bg-card">
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-4">Recomendaciones</p>
            <div className="space-y-2.5">
              {insights.slice(0, 4).map((insight, i) => {
                const cfg  = INSIGHT_CONFIG[insight.type];
                const Icon = cfg.icon;
                return (
                  <div key={i} className={cn("flex items-start gap-2.5 border rounded-xl p-3", cfg.border)}>
                    <Icon size={13} className={cn("mt-0.5 shrink-0", cfg.iconColor)} />
                    <div className="min-w-0">
                      <p className={cn("text-xs font-medium", cfg.titleColor)}>{insight.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Fila 4: Recurrentes (si hay) ── */}
        {recurring.length > 0 && (
          <div className="border border-border rounded-2xl p-5 bg-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Patrones repetidos</p>
                <p className="text-sm font-medium mt-0.5">Gastos recurrentes</p>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                <RefreshCw size={11} />{recurring.length} detectados
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {recurring.slice(0, 6).map((r, i) => (
                <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl border border-border">
                  <RefreshCw size={12} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{r.description}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{CATEGORY_LABELS[r.category]} · {r.count}x</p>
                  </div>
                  <p className="text-xs font-mono text-expense shrink-0">${Math.round(r.avgAmount).toLocaleString("es-AR")}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
