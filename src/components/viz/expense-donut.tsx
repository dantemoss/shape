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
  const size = 210;
  const cx = 105;
  const cy = 105;
  const r = 72;
  const c = 2 * Math.PI * r;
  const gap = 16;
  const arcs = slices.reduce<Array<{ slice: DonutSlice; length: number; offset: number }>>((list, slice) => {
    const length = Math.max(10, (slice.value / total) * c - gap);
    const offset = list.reduce((sum, arc) => sum + arc.length + gap, 0);
    return [...list, { slice, length, offset }];
  }, []);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-[190px] w-[190px] shrink-0" role="img" aria-label="Distribución de gastos">
      <defs>
        <pattern id={`${uid}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="6" height="6" fill="#f7f1e6" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#e7dccb" strokeWidth="2" />
        </pattern>
      </defs>
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {arcs.map(({ slice, length, offset }, index) => (
          <circle
            key={slice.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={slice.hatch ? `url(#${uid}-hatch)` : slice.color}
            strokeWidth="26"
            strokeLinecap="round"
            strokeDasharray={`${length} ${c - length}`}
            strokeDashoffset={-offset}
            className="viz-donut"
            style={{ animationDelay: `${index * 80}ms` }}
          />
        ))}
      </g>
    </svg>
  );
}
