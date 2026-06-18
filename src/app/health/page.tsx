"use client";

import { useShapeStore } from "@/lib/store";
import {
  getCategoryBreakdown,
  getRecurringExpenses,
  getMonthComparison,
  generateInsights,
} from "@/lib/health-utils";
import { CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingUp, TrendingDown, Lightbulb, CheckCircle2, RefreshCw, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
  Cell,
  PieChart,
  Pie,
  Tooltip,
} from "recharts";

const INSIGHT_CONFIG = {
  warning: {
    icon: AlertTriangle,
    bg: "bg-expense/8 border-expense/25",
    iconColor: "text-expense",
    titleColor: "text-expense",
  },
  tip: {
    icon: Lightbulb,
    bg: "bg-muted/60 border-border",
    iconColor: "text-muted-foreground",
    titleColor: "text-foreground",
  },
  positive: {
    icon: CheckCircle2,
    bg: "bg-income/8 border-income/25",
    iconColor: "text-income",
    titleColor: "text-income",
  },
};

const PIE_COLORS = [
  "oklch(0.55 0.15 162)",
  "oklch(0.577 0.245 27.325)",
  "oklch(0.439 0 0)",
  "oklch(0.65 0.12 220)",
  "oklch(0.65 0.12 300)",
];

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-background border border-border rounded-xl p-3 text-xs shadow-lg">
      <p className="font-medium">{item.label}</p>
      <p className="text-muted-foreground font-mono">${item.amount.toLocaleString("es-AR")}</p>
      <p className="text-muted-foreground">{Math.round(item.percentage)}% de gastos</p>
    </div>
  );
}

export default function HealthPage() {
  const transactions = useShapeStore((s) => s.transactions);
  const salaryConfig = useShapeStore((s) => s.salaryConfig);

  const salary = salaryConfig?.amount ?? 0;
  const breakdown = getCategoryBreakdown(transactions, salary);
  const recurring = getRecurringExpenses(transactions);
  const monthComp = getMonthComparison(transactions);
  const insights = generateInsights(transactions, salary);

  const totalExpenses = breakdown.reduce((s, b) => s + b.amount, 0);
  const expenseRatio = salary > 0 ? (totalExpenses / salary) * 100 : 0;

  return (
    <div className="min-h-screen">
      <div className="border-b border-border px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight">Higiene Financiera</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Análisis de tus hábitos y recomendaciones
        </p>
      </div>
      <div className="px-8 py-6 space-y-8">

      {/* Score visual + comparación mensual */}
      <div className="grid grid-cols-3 gap-4">
        {/* Ratio gasto/sueldo */}
        <div className="border border-border rounded-xl p-5 bg-card col-span-1">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
            Gastos vs Sueldo
          </p>
          {salary > 0 ? (
            <>
              <div className="flex items-end gap-1 mb-3">
                <span className={cn(
                  "text-3xl font-semibold tabular-nums",
                  expenseRatio > 90 ? "text-expense" : expenseRatio > 70 ? "text-amber-500" : "text-income"
                )}>
                  <NumberFlow value={Math.round(expenseRatio)} />%
                </span>
                <span className="text-sm text-muted-foreground mb-1">del sueldo</span>
              </div>
              <Progress
                value={Math.min(expenseRatio, 100)}
                className={cn(
                  "h-2",
                  expenseRatio > 90
                    ? "[&>div]:bg-expense"
                    : expenseRatio > 70
                    ? "[&>div]:bg-amber-500"
                    : "[&>div]:bg-income"
                )}
              />
              <p className="text-xs text-muted-foreground mt-2">
                ${totalExpenses.toLocaleString("es-AR")} de ${salary.toLocaleString("es-AR")}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Configurá tu sueldo para ver este dato</p>
          )}
        </div>

        {/* Comparación mensual */}
        <div className="border border-border rounded-xl p-5 bg-card">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
            Este mes vs anterior
          </p>
          {monthComp.previous > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                {monthComp.change <= 0 ? (
                  <TrendingDown size={18} className="text-income" />
                ) : (
                  <TrendingUp size={18} className="text-expense" />
                )}
                <span className={cn(
                  "text-2xl font-semibold font-mono",
                  monthComp.change <= 0 ? "text-income" : "text-expense"
                )}>
                  {monthComp.change <= 0 ? "" : "+"}
                  <NumberFlow value={Math.round(monthComp.changePercent)} />%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Este mes: <span className="font-mono font-medium text-foreground">${monthComp.current.toLocaleString("es-AR")}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Mes pasado: <span className="font-mono">${monthComp.previous.toLocaleString("es-AR")}</span>
              </p>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Sin datos del mes anterior</div>
          )}
        </div>

        {/* Ahorrable */}
        <div className="border border-border rounded-xl p-5 bg-card">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
            Disponible para ahorrar
          </p>
          {salary > 0 ? (
            <>
              <div className={cn(
                "text-2xl font-semibold font-mono mb-1",
                salary - totalExpenses >= 0 ? "text-income" : "text-expense"
              )}>
                $<NumberFlow value={Math.abs(salary - totalExpenses)} locales="es-AR" format={{ maximumFractionDigits: 0 }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {salary - totalExpenses >= 0
                  ? `${Math.round(((salary - totalExpenses) / salary) * 100)}% de tu sueldo libre`
                  : "Excediste tu sueldo"}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Configurá tu sueldo</p>
          )}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Observaciones
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {insights.map((insight, i) => {
              const config = INSIGHT_CONFIG[insight.type];
              const Icon = config.icon;
              return (
                <div key={i} className={cn("border rounded-xl p-4", config.bg)}>
                  <div className="flex items-start gap-3">
                    <Icon size={15} className={cn("mt-0.5 shrink-0", config.iconColor)} />
                    <div>
                      <p className={cn("text-sm font-semibold", config.titleColor)}>
                        {insight.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Distribución por categorías */}
      {breakdown.length > 0 && (
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 border border-border rounded-xl p-5 bg-card">
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
              Distribución por categoría
            </h2>
            <div className="space-y-3">
              {breakdown.map((cat, i) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{cat.label}</span>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-muted-foreground">{Math.round(cat.percentage)}%</span>
                      <span className="text-expense font-semibold">
                        -${cat.amount.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                  </div>
                  {salary > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {Math.round(cat.salaryPercentage)}% del sueldo · {cat.count} transacciones
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mini pie */}
          <div className="col-span-2 border border-border rounded-xl p-5 bg-card">
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
              Composición
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={breakdown.slice(0, 5).map((b, i) => ({ ...b, fill: PIE_COLORS[i] }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="amount"
                >
                  {breakdown.slice(0, 5).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {breakdown.slice(0, 4).map((b, i) => (
                <div key={b.category} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground truncate">{b.label}</span>
                  <span className="font-mono ml-auto">{Math.round(b.percentage)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gastos repetitivos */}
      {recurring.length > 0 && (
        <div>
          <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <RefreshCw size={12} />
            Gastos repetitivos detectados
          </h2>
          <div className="space-y-2">
            {recurring.map((r) => (
              <div
                key={r.description}
                className="flex items-center justify-between gap-4 p-4 border border-border rounded-xl bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-expense/10 flex items-center justify-center shrink-0">
                    <RefreshCw size={13} className="text-expense" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{CATEGORY_LABELS[r.category]}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        Último: {format(new Date(r.lastDate), "d MMM", { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-mono font-semibold text-expense">
                    ${r.avgAmount.toLocaleString("es-AR")} <span className="text-muted-foreground font-normal">/ vez</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{r.count} veces · ${r.totalAmount.toLocaleString("es-AR")} total</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-sm font-medium">Sin datos para analizar</p>
          <p className="text-xs mt-1">Registrá movimientos para ver tu higiene financiera</p>
        </div>
      )}
      </div>
    </div>
  );
}
