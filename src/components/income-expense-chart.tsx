"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface IncomeExpenseChartProps {
  data: MonthlyData[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-xl p-3 text-sm shadow-lg">
      <p className="font-mono text-xs text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.fill }} />
          <span className="text-muted-foreground">
            {entry.name === "income" ? "Ingresos" : "Gastos"}:
          </span>
          <span className="font-semibold font-mono">${entry.value.toLocaleString("es-AR")}</span>
        </div>
      ))}
    </div>
  );
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  return (
    <div className="border border-border rounded-xl p-5 bg-card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Ingresos vs Gastos
        </h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-income inline-block" />
            <span className="text-muted-foreground">Ingresos</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-expense inline-block" />
            <span className="text-muted-foreground">Gastos</span>
          </span>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          Sin datos todavía
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barGap={4} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="oklch(0.90 0 0)" strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", fill: "oklch(0.50 0 0)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", fill: "oklch(0.50 0 0)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "oklch(0.96 0 0)", radius: 4 }} />
            <Bar dataKey="income" fill="oklch(0.55 0.15 162)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="oklch(0.577 0.245 27.325)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
