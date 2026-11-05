"use client";

import { useId, useState } from "react";
import { Landmark } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Amount } from "@/components/primitives";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { formatSignedPercent } from "@/lib/chart-format";
import type { BalancePoint } from "@/lib/chart-series";
import { ChartCard, EmptyChart } from "./ui";
import { CHART_MS, ChartPlot, ShapeTooltipContent, chartPlotClass } from "./shape-tooltip";

const chartConfig = {
  balance: { label: "Saldo", color: "var(--chart-3)" },
};

export function BalanceLineCard({ points }: { points: BalancePoint[] }) {
  const uid = useId().replace(/:/g, "");
  const [active, setActive] = useState(Math.max(0, points.length - 1));
  const selected = points[active];
  const hasBaseline = points.some((point) => point.hasBaseline);

  return (
    <ChartCard
      title="Saldo"
      subtitle={hasBaseline ? "Saldo real al cierre de cada mes" : "Neto del mes, porque todavía no hay saldo inicial"}
      href="/transactions"
    >
      {points.length === 0 ? (
        <EmptyChart>Sin meses para dibujar.</EmptyChart>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[13px] text-[#9aa1ab]">
                <Landmark size={13} className="text-[#1c1f26]" />
                Saldo
              </p>
              <div className="mt-1.5">
                <Amount value={selected?.balance ?? 0} tone={(selected?.balance ?? 0) < 0 ? "expense" : "neutral"} />
              </div>
            </div>
            {selected?.changePct != null ? (
              <p className={selected.changePct >= 0 ? "text-[13px] font-semibold text-income" : "text-[13px] font-semibold text-expense"}>
                {formatSignedPercent(selected.changePct)} vs el mes anterior
              </p>
            ) : null}
          </div>
          <ChartPlot label="Saldo en el tiempo">
            <ChartContainer config={chartConfig} className={chartPlotClass}>
              <AreaChart
                accessibilityLayer
                data={points}
                margin={{ top: 12, right: 8, bottom: 0, left: 8 }}
                onClick={(state) => {
                  const index = state?.activeTooltipIndex;
                  if (typeof index === "number") setActive(index);
                }}
              >
                <defs>
                  <linearGradient id={`${uid}-balance`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  allowEscapeViewBox={{ x: false, y: false }}
                  content={
                    <ShapeTooltipContent
                      rows={(point) => [
                        {
                          swatch: "var(--chart-3)",
                          value: Number(point.balance),
                          hint: "Saldo",
                          tone: Number(point.balance) < 0 ? "expense" : "neutral",
                        },
                        { swatch: "var(--chart-1)", value: Number(point.income), hint: "Ingresos", tone: "income" },
                      ]}
                    />
                  }
                />
                <Area
                  dataKey="balance"
                  type="natural"
                  fill={`url(#${uid}-balance)`}
                  stroke="var(--color-balance)"
                  strokeWidth={2}
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
