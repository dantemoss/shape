"use client";

import { useId } from "react";
import { formatChartPesos } from "@/lib/chart-format";
import type { DonutSlice, SpendWindow } from "@/lib/chart-series";
import { ChartCard, DeltaPill, EmptyChart, HeroNumber, Segmented } from "./ui";

const COMPARE: Record<SpendWindow, string> = {
  week: "vs la semana anterior",
  month: "vs el mes anterior",
  year: "vs el año anterior",
};

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
        <div className="flex flex-col gap-5 min-[420px]:flex-row min-[420px]:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-[#9aa1ab]">Total de gastos</p>
            <HeroNumber className="mt-1">{formatChartPesos(total)}</HeroNumber>
            {delta != null ? (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-[#9aa1ab]">
                <DeltaPill value={delta} positiveIsGood={false} />
                {COMPARE[window]}
              </p>
            ) : (
              <p className="mt-2 text-[13px] text-[#9aa1ab]">Sin período anterior para comparar</p>
            )}
            <ul className="mt-4 space-y-2">
              {slices.map((slice) => (
                <li key={slice.label} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f6f7f9] px-3.5 py-2.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        background: slice.hatch
                          ? "repeating-linear-gradient(135deg, #f3eee4, #f3eee4 2px, #e4d8c4 2px, #e4d8c4 3px)"
                          : slice.color,
                      }}
                    />
                    <span className="truncate text-[14px] text-[#3a4150]">{slice.label}</span>
                  </span>
                  <span className="shrink-0 text-[14px] font-semibold tabular-nums tracking-tight text-[#1c1f26]">
                    {formatChartPesos(slice.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <Donut uid={uid} slices={slices} total={sum} />
        </div>
      )}
    </ChartCard>
  );
}

function Donut({ uid, slices, total }: { uid: string; slices: DonutSlice[]; total: number }) {
  const size = 176;
  const cx = 88;
  const cy = 88;
  const r = 58;
  const stroke = 18;
  const circumference = 2 * Math.PI * r;
  const arcs = layoutDonut(slices, total, circumference, stroke);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-[168px] w-[168px] shrink-0" role="img" aria-label="Distribución de gastos">
      <defs>
        <pattern id={`${uid}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="6" height="6" fill="#f6f1e6" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#e4d5bc" strokeWidth="2" />
        </pattern>
      </defs>
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {arcs.map(({ slice, dash, offset }, index) => (
          <circle
            key={slice.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={slice.hatch ? `url(#${uid}-hatch)` : slice.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            className="viz-donut"
            style={{ animationDelay: `${index * 70}ms` }}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * Cada extremo redondeado sobresale medio grosor. El tramo sin pintar
 * tiene que incluir ese grosor más un hueco visible, si no los caps se pisan.
 */
function layoutDonut(slices: DonutSlice[], total: number, circumference: number, stroke: number) {
  const count = slices.length;
  if (count === 0 || total <= 0) return [];
  const clearGap = 9;
  let unpainted = stroke + clearGap;
  let budget = circumference - count * unpainted;
  if (budget < count * 2) {
    unpainted = Math.max(stroke + 3, (circumference - count * 2) / count);
    budget = Math.max(count, circumference - count * unpainted);
  }
  const minDash = Math.min(7, budget / count);
  const weights = slices.map((slice) => slice.value / total);
  const dashes = allocateDashes(weights, budget, minDash);
  let cursor = 0;
  return slices.map((slice, index) => {
    const dash = dashes[index] ?? 0;
    const arc = { slice, dash, offset: cursor };
    cursor += dash + unpainted;
    return arc;
  });
}

function allocateDashes(weights: number[], budget: number, minimum: number): number[] {
  const count = weights.length;
  if (count === 0) return [];
  if (count * minimum >= budget - 0.01) {
    const even = budget / count;
    return weights.map(() => even);
  }
  const result = weights.map((weight) => weight * budget);
  for (let pass = 0; pass < count + 1; pass += 1) {
    let sum = 0;
    let raised = 0;
    for (let index = 0; index < count; index += 1) {
      if (result[index] < minimum) {
        raised += minimum - result[index];
        result[index] = minimum;
      }
      sum += result[index];
    }
    const extra = sum - budget;
    if (extra <= 0.05) break;
    const flexible = result
      .map((value, index) => (value > minimum + 0.05 ? index : -1))
      .filter((index) => index >= 0);
    const flexibleSum = flexible.reduce((total, index) => total + (result[index] - minimum), 0);
    if (flexibleSum <= 0.05) break;
    const cut = Math.min(extra, flexibleSum);
    for (const index of flexible) {
      const room = result[index] - minimum;
      result[index] -= cut * (room / flexibleSum);
    }
    if (raised === 0 && extra <= 0.05) break;
  }
  return result;
}
