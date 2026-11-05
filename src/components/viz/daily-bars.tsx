"use client";

import { useId } from "react";
import { Bar, BarChart, XAxis } from "recharts";
import { Amount } from "@/components/primitives";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { averageElapsedSpend, elapsedSpend, type AlignedDay } from "@/lib/chart-series";
import { ChartCard, EmptyChart } from "./ui";
import { CHART_MS, ChartPlot, ShapeTooltipContent, chartPlotClass } from "./shape-tooltip";

const chartConfig = {
  previous: { label: "Período anterior", color: "var(--chart-1)" },
  current: { label: "Este período", color: "var(--chart-1)" },
};

export function DailyBarsCard({ days, periodLabel }: { days: AlignedDay[]; periodLabel: string | null }) {
  const patternId = useId().replace(/:/g, "");
  const interval = days.length > 18 ? 3 : days.length > 10 ? 2 : 0;

  return (
    <ChartCard title="Gasto diario" subtitle={periodLabel ?? "Período de cobro"} href="/transactions">
      {days.length === 0 ? (
        <EmptyChart>Configurá el sueldo para ver el gasto día por día.</EmptyChart>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-[#9aa1ab]">Gasto del período</p>
              <div className="mt-1.5">
                <Amount value={elapsedSpend(days)} tone="expense" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] text-[#9aa1ab]">Promedio por día</p>
              <div className="mt-1.5">
                <Amount value={averageElapsedSpend(days)} />
              </div>
            </div>
          </div>
          <ChartPlot label="Gasto diario contra el período anterior">
            <ChartContainer config={chartConfig} className={chartPlotClass}>
              <BarChart accessibilityLayer data={days} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <pattern id={patternId} x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
                    <rect width="5" height="5" fill="var(--color-previous)" opacity="0.1" />
                    <circle cx="5" cy="5" r="1.4" fill="var(--color-previous)" />
                  </pattern>
                </defs>
                <XAxis
                  dataKey="dayNumber"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={interval}
                />
                <ChartTooltip
                  cursor={false}
                  allowEscapeViewBox={{ x: false, y: false }}
                  content={
                    <ShapeTooltipContent
                      rows={(point) => [
                        {
                          swatch: "var(--chart-1)",
                          value: Number(point.current),
                          hint: `${point.dayNumber ?? ""} ${point.monthLabel ?? ""}`.trim(),
                          tone: "expense",
                        },
                        {
                          swatch: "#d5d8de",
                          value: Number(point.previous),
                          hint: "Período anterior",
                        },
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey="previous"
                  fill={`url(#${patternId})`}
                  stroke="var(--color-previous)"
                  strokeWidth={1}
                  radius={4}
                  animationDuration={CHART_MS}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="current"
                  fill="var(--color-current)"
                  stroke="var(--color-current)"
                  strokeWidth={1}
                  radius={4}
                  animationDuration={CHART_MS}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ChartContainer>
          </ChartPlot>
          <p className="mt-1 text-[12px] text-[#b0b6bf]">La barra punteada es el mismo día del período anterior.</p>
        </>
      )}
    </ChartCard>
  );
}
