"use client";

import { useId, useState } from "react";
import { formatAxisPesos, formatChartPesos, formatSignedPercent, paddedDomain } from "@/lib/chart-format";
import type { AreaPoint } from "@/lib/chart-series";
import { clampPercent, smoothArea, smoothLine, yAt } from "./geometry";
import { ChartCard, EmptyChart, HeroNumber, HoverTip, TipAnchor, chartPlotClass } from "./ui";

const W = 360;
const H = 210;
const PAD_L = 8;
const PAD_R = 44;
const PAD_T = 14;
const PAD_B = 26;

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
  const [active, setActive] = useState(Math.max(0, points.findIndex((point) => point.date === lastCurrent?.date)));
  const values = points.flatMap((point) => [point.previous, point.current].filter((value): value is number => value != null));
  const domain = paddedDomain(values);
  const plotBottom = H - PAD_B;
  const slot = points.length > 1 ? (W - PAD_L - PAD_R) / (points.length - 1) : 0;
  const previous = points.map((point, index) => ({
    x: PAD_L + slot * index,
    y: yAt(point.previous, domain.min, domain.max, PAD_T, plotBottom),
  }));
  const current = points
    .map((point, index) =>
      point.current == null
        ? null
        : { x: PAD_L + slot * index, y: yAt(point.current, domain.min, domain.max, PAD_T, plotBottom) }
    )
    .filter((point): point is { x: number; y: number } => point != null);
  const selected = points[active];
  const x = PAD_L + slot * active;
  const ticks = [domain.max, (domain.max + domain.min) / 2, domain.min];

  return (
    <ChartCard title="Este período y el anterior" subtitle="La línea azul es ahora. La gris, el período previo." href="/health">
      {points.length === 0 ? (
        <EmptyChart>No hay un período para comparar.</EmptyChart>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-[#9aa1ab]">{currentLabel}</p>
              <HeroNumber className="mt-1">{formatChartPesos(lastCurrent?.current ?? 0)}</HeroNumber>
            </div>
            {delta != null ? (
              <p className={delta >= 0 ? "text-[1.35rem] font-bold tracking-tight text-[#1f9d55]" : "text-[1.35rem] font-bold tracking-tight text-[#e5484d]"}>
                {formatSignedPercent(delta, 0)}
                <span className="ml-1 text-[12px] font-medium text-[#9aa1ab]">vs anterior</span>
              </p>
            ) : null}
          </div>
          <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className={chartPlotClass} role="img" aria-label="Comparación del período">
              <defs>
                <linearGradient id={`${uid}-blue`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`${uid}-grey`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0" />
                </linearGradient>
              </defs>
              {ticks.map((tick, index) => {
                const y = yAt(tick, domain.min, domain.max, PAD_T, plotBottom);
                return (
                  <g key={index}>
                    <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="#f1f2f4" />
                    <text x={W - 2} y={y + 4} textAnchor="end" fill="#c5cad3" fontSize="11">
                      {formatAxisPesos(tick)}
                    </text>
                  </g>
                );
              })}
              <path d={smoothArea(previous, plotBottom)} fill={`url(#${uid}-grey)`} />
              <path d={smoothLine(previous)} fill="none" stroke="#d4d8e0" strokeWidth="1.6" />
              <path d={smoothArea(current, plotBottom)} fill={`url(#${uid}-blue)`} />
              <path d={smoothLine(current)} fill="none" stroke="#3b82f6" strokeWidth="2.2" className="viz-line" />
              <line x1={x} x2={x} y1={PAD_T} y2={plotBottom} stroke="#93c5fd" strokeDasharray="3 4" />
              {current.length > 0 ? (
                <circle cx={current[Math.min(active, current.length - 1)].x} cy={current[Math.min(active, current.length - 1)].y} r="4" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
              ) : null}
              <text x={PAD_L} y={H - 6} fill="#c5cad3" fontSize="11">
                {points[0]?.label}
              </text>
              <text x={PAD_L + slot * active} y={H - 6} textAnchor="middle" fill="#2563eb" fontSize="11" fontWeight={600}>
                {selected?.label}
              </text>
              {points.map((point, index) => (
                <rect
                  key={point.date}
                  x={PAD_L + slot * index - slot / 2}
                  y={0}
                  width={Math.max(slot, 16)}
                  height={H}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => setActive(index)}
                />
              ))}
            </svg>
            {selected ? (
              <TipAnchor left={`${clampPercent((x / W) * 100, 22, 70)}%`} top="22%">
                <HoverTip
                  rows={[
                    { swatch: "#3b82f6", value: formatChartPesos(selected.current ?? 0), hint: selected.label },
                    { swatch: "#cbd5e1", value: formatChartPesos(selected.previous), hint: "Anterior" },
                  ]}
                />
              </TipAnchor>
            ) : null}
          </div>
        </>
      )}
    </ChartCard>
  );
}
