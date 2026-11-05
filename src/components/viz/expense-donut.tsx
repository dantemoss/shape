"use client";

import { useId } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { Amount } from "@/components/primitives";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { DonutSlice, SpendWindow } from "@/lib/chart-series";
import { ChartCard, EmptyChart, Segmented } from "./ui";
import { CHART_MS, ShapeTooltipContent, SignedPercent } from "./shape-tooltip";

const COMPARE: Record<SpendWindow, string> = {
  week: "vs la semana anterior",
  month: "vs el mes anterior",
  year: "vs el año anterior",
};

const REST = "#F3EEE4";

export function ExpenseDonutCard({
  total,
  previous,
  slices,
  window,
  onWindow,
}: {
  total: number;
  previous: number;
  slices: DonutSlice[];
  window: SpendWindow;
  onWindow: (window: SpendWindow) => void;
}) {
  const uid = useId().replace(/:/g, "");
  const delta = previous > 0 ? ((total - previous) / previous) * 100 : null;
  const sum = slices.reduce((acc, slice) => acc + slice.value, 0);
  const data = slices.map((slice) => ({
    key: slice.label,
    value: slice.value,
    fill: slice.hatch ? REST : slice.color,
  }));
  const chartConfig = {
    value: { label: "Gastos" },
    ...Object.fromEntries(data.map((slice) => [slice.key, { label: slice.key, color: slice.fill }])),
  };

  return (
    <ChartCard
      title="Gastos"
      subtitle="Cómo se reparte lo que salió"
      action={
        <Segmented
          label="Período de gastos"
          value={window}
          onChange={onWindow}
          options={[
            { value: "week", label: "Semana" },
            { value: "month", label: "Mes" },
            { value: "year", label: "Año" },
          ]}
        />
      }
    >
      {sum <= 0 ? (
        <EmptyChart>No hay gastos en pesos en este período.</EmptyChart>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 min-[420px]:flex-row min-[420px]:items-center">
          <div className="relative mx-auto h-[220px] w-[220px] shrink-0">
            <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-[220px] max-w-none" aria-hidden>
              <PieChart accessibilityLayer>
                <ChartTooltip
                  allowEscapeViewBox={{ x: false, y: false }}
                  content={
                    <ShapeTooltipContent
                      rows={(point) => [
                        {
                          swatch: String(point.fill ?? REST),
                          value: Number(point.value),
                          hint: String(point.key ?? ""),
                        },
                      ]}
                    />
                  }
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="key"
                  innerRadius={68}
                  outerRadius={96}
                  cornerRadius={8}
                  paddingAngle={4}
                  stroke="var(--background)"
                  strokeWidth={3}
                  animationDuration={CHART_MS}
                  animationEasing="ease-out"
                >
                  {data.map((slice) => (
                    <Cell key={`${uid}-${slice.key}`} fill={slice.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center">
              <Amount value={total} size="primary" tone="expense" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            {delta != null ? (
              <p className="mb-3 flex flex-wrap items-center gap-2 text-[13px] text-[#9aa1ab]">
                <SignedPercent value={delta} positiveIsGood={false} />
                {COMPARE[window]}
              </p>
            ) : (
              <p className="mb-3 text-[13px] text-[#9aa1ab]">Sin período anterior para comparar</p>
            )}
            <ul className="space-y-2">
              {slices.map((slice) => (
                <li key={slice.label} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f6f7f9] px-3.5 py-2.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: slice.hatch ? REST : slice.color }} />
                    <span className="truncate text-[14px] text-[#3a4150]">{slice.label}</span>
                  </span>
                  <Amount value={slice.value} size="secondary" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </ChartCard>
  );
}
