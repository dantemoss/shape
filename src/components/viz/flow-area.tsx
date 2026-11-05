"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Amount } from "@/components/primitives";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { formatSignedPercent } from "@/lib/chart-format";
import type { AreaPoint } from "@/lib/chart-series";
import { ChartCard, EmptyChart } from "./ui";
import { CHART_MS, ChartPlot, ShapeTooltipContent, chartPlotClass } from "./shape-tooltip";

const chartConfig = {
  current: { label: "Este período", color: "var(--chart-3)" },
  previous: { label: "Anterior", color: "#c5cad3" },
};

export function FlowAreaCard({
  points,
  currentLabel,
  delta,
}: {
  points: AreaPoint[];
  currentLabel: string;
  delta: number | null;
}) {
  const uid = useId().replace(/:/g, "");
  const lastCurrent = [...points].reverse().find((point) => point.current != null);

  return (
    <ChartCard title="Este período y el anterior" subtitle="La línea de marca es ahora. La gris, el período previo." href="/health">
      {points.length === 0 ? (
        <EmptyChart>No hay un período para comparar.</EmptyChart>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-[#9aa1ab]">{currentLabel}</p>
              <div className="mt-1.5">
                <Amount value={lastCurrent?.current ?? 0} />
              </div>
            </div>
            {delta != null ? (
              <p className={delta >= 0 ? "text-[13px] font-semibold text-income" : "text-[13px] font-semibold text-expense"}>
                {formatSignedPercent(delta, 0)}
                <span className="ml-1 text-[12px] font-medium text-[#9aa1ab]">vs anterior</span>
              </p>
            ) : null}
          </div>
          <ChartPlot label="Comparación del período">
            <ChartContainer config={chartConfig} className={chartPlotClass}>
              <AreaChart
                accessibilityLayer
                data={points}
                margin={{ top: 12, right: 8, bottom: 0, left: 8 }}
              >
                <defs>
                  <linearGradient id={`${uid}-current`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-current)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--color-current)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id={`${uid}-previous`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b919c" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#8b919c" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
                <ChartTooltip
                  cursor={false}
                  allowEscapeViewBox={{ x: false, y: false }}
                  content={
                    <ShapeTooltipContent
                      rows={(point) => {
                        const lines = [];
                        if (typeof point.current === "number") {
                          lines.push({
                            swatch: "var(--chart-3)",
                            value: point.current,
                            hint: String(point.label ?? ""),
                          });
                        }
                        lines.push({
                          swatch: "#8b919c",
                          value: Number(point.previous),
                          hint: "Anterior",
                        });
                        return lines;
                      }}
                    />
                  }
                />
                <Area
                  dataKey="previous"
                  type="natural"
                  fill={`url(#${uid}-previous)`}
                  stroke="#8b919c"
                  strokeWidth={1.6}
                  animationDuration={CHART_MS}
                  animationEasing="ease-out"
                />
                <Area
                  dataKey="current"
                  type="natural"
                  fill={`url(#${uid}-current)`}
                  stroke="var(--color-current)"
                  strokeWidth={2}
                  connectNulls={false}
                  dot={points.filter((point) => point.current != null).length < 3 ? { r: 3.5, fill: "var(--color-current)", stroke: "#fff", strokeWidth: 1.5 } : false}
                  animationDuration={CHART_MS}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ChartContainer>
          </ChartPlot>
        </>
      )}
    </ChartCard>
  );
}
