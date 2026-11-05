"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Amount } from "@/components/primitives";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { MonthFlowPoint } from "@/lib/chart-series";
import { ChartCard, EmptyChart } from "./ui";
import { CHART_MS, ChartPlot, ShapeTooltipContent, chartPlotClass } from "./shape-tooltip";

const chartConfig = {
  income: { label: "Ingresos", color: "var(--chart-1)" },
  expense: { label: "Gastos", color: "var(--chart-2)" },
};

export function MonthlyBarsCard({ points }: { points: MonthFlowPoint[] }) {
  const [active, setActive] = useState(Math.max(0, points.length - 1));
  const selected = points[active];
  const empty = points.every((point) => point.income === 0 && point.expense === 0);

  return (
    <ChartCard title="Flujo de caja" subtitle="Ingresos y gastos en pesos, mes a mes" href="/transactions">
      {empty ? (
        <EmptyChart>Cuando cargues movimientos en pesos, el mes se dibuja acá.</EmptyChart>
      ) : (
        <>
          {selected ? (
            <div className="mb-3 grid shrink-0 grid-cols-2 gap-3">
              <div className="min-w-0">
                <p className="text-[13px] text-[#9aa1ab]">Ingresos · {selected.label}</p>
                <div className="mt-1.5">
                  <Amount value={selected.income} tone="income" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] text-[#9aa1ab]">Gastos · {selected.label}</p>
                <div className="mt-1.5">
                  <Amount value={selected.expense} tone="expense" />
                </div>
              </div>
            </div>
          ) : null}
          <ChartPlot label="Ingresos y gastos por mes">
            <ChartContainer config={chartConfig} className={chartPlotClass}>
              <BarChart
                accessibilityLayer
                data={points}
                onClick={(state) => {
                  const index = state?.activeTooltipIndex;
                  if (typeof index === "number") setActive(index);
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  allowEscapeViewBox={{ x: false, y: false }}
                  content={
                    <ShapeTooltipContent
                      rows={(point) => [
                        { swatch: "var(--chart-1)", value: Number(point.income), hint: "Ingresos", tone: "income" },
                        { swatch: "var(--chart-2)", value: Number(point.expense), hint: "Gastos", tone: "expense" },
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey="income"
                  fill="var(--color-income)"
                  radius={4}
                  animationDuration={CHART_MS}
                  animationEasing="ease-out"
                  onClick={(_, index) => setActive(index)}
                />
                <Bar
                  dataKey="expense"
                  fill="var(--color-expense)"
                  radius={4}
                  animationDuration={CHART_MS}
                  animationEasing="ease-out"
                  onClick={(_, index) => setActive(index)}
                />
              </BarChart>
            </ChartContainer>
          </ChartPlot>
          <p className="mt-1 shrink-0 text-[12px] text-[#b0b6bf]">Tocá un mes para ver ingresos y gastos.</p>
        </>
      )}
    </ChartCard>
  );
}
