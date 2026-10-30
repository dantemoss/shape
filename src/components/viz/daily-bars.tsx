"use client";

import { useId, useState } from "react";
import { formatAxisPesos, formatChartPesos, niceCeiling } from "@/lib/chart-format";
import type { AlignedDay } from "@/lib/chart-series";
import { averageElapsedSpend, elapsedSpend } from "@/lib/chart-series";
import { clampPercent, topRoundedBar, yAt } from "./geometry";
import { ChartCard, EmptyChart, HeroNumber, HoverTip, TipAnchor, chartPlotClass } from "./ui";

const W = 360;
const H = 210;
const PAD_L = 46;
const PAD_R = 8;
const PAD_T = 12;
const PAD_B = 32;

export function DailyBarsCard({ days, periodLabel }: { days: AlignedDay[]; periodLabel: string | null }) {
  const uid = useId().replace(/:/g, "");
  const elapsed = days.filter((day) => !day.future);
  const withSpend = elapsed.reduce((found, day, index) => (day.current > 0 ? index : found), Math.max(0, elapsed.length - 1));
  const [active, setActive] = useState(withSpend);
  const max = Math.max(1, ...days.flatMap((day) => [day.current, day.previous]));
  const { top, ticks } = niceCeiling(max, 3);
  const plotBottom = H - PAD_B;
  const plotW = W - PAD_L - PAD_R;
  const slot = days.length > 0 ? plotW / days.length : plotW;
  const barW = Math.min(14, Math.max(4, slot * 0.42));
  const selected = days[active];
  const step = days.length > 18 ? 3 : days.length > 10 ? 2 : 1;

  return (
    <ChartCard
      title="Gasto diario"
      subtitle={periodLabel ?? "Período de cobro"}
      href="/transactions"
    >
      {days.length === 0 ? (
        <EmptyChart>Configurá el sueldo para ver el gasto día por día.</EmptyChart>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-[#9aa1ab]">Gasto del período</p>
              <HeroNumber className="mt-1 text-[clamp(1.35rem,5vw,2rem)]">{formatChartPesos(elapsedSpend(days))}</HeroNumber>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] text-[#9aa1ab]">Promedio por día</p>
              <HeroNumber className="mt-1 text-[clamp(1.35rem,5vw,2rem)]">{formatChartPesos(averageElapsedSpend(days))}</HeroNumber>
            </div>
          </div>
          <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className={chartPlotClass} role="img" aria-label="Gasto diario contra el período anterior">
              <defs>
                <linearGradient id={`${uid}-green`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
              </defs>
              {ticks.map((tick) => {
                const y = yAt(tick, 0, top, PAD_T, plotBottom);
                return (
                  <g key={tick}>
                    <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="#eef0f3" />
                    <text x={PAD_L - 6} y={y + 4} textAnchor="end" fill="#c5cad3" fontSize="11">
                      {formatAxisPesos(tick)}
                    </text>
                  </g>
                );
              })}
              {days.map((day, index) => {
                const center = PAD_L + slot * index + slot / 2;
                const hPrev = (day.previous / top) * (plotBottom - PAD_T);
                const hCur = (day.current / top) * (plotBottom - PAD_T);
                const showLabel = index % step === 0 || index === days.length - 1;
                return (
                  <g key={day.date}>
                    <path
                      d={topRoundedBar(center - barW / 2 - 1, plotBottom - hPrev, barW + 2, hPrev, 5)}
                      fill="#eceff2"
                    />
                    <path
                      d={topRoundedBar(center - (barW * 0.72) / 2, plotBottom - hCur, barW * 0.72, hCur, 4)}
                      fill={day.future ? "#e5e7eb" : `url(#${uid}-green)`}
                      className="viz-bar"
                      style={{ animationDelay: `${index * 18}ms` }}
                    />
                    {showLabel ? (
                      <text x={center} y={H - 10} textAnchor="middle" fill={index === active ? "#1c1f26" : "#c5cad3"} fontSize="10" fontWeight={index === active ? 600 : 500}>
                        {day.dayNumber}
                      </text>
                    ) : null}
                    <rect
                      x={PAD_L + slot * index}
                      y={PAD_T}
                      width={slot}
                      height={plotBottom - PAD_T + 20}
                      fill="transparent"
                      className="cursor-pointer"
                      onClick={() => setActive(index)}
                    />
                  </g>
                );
              })}
            </svg>
            {selected ? (
              <TipAnchor
                left={`${clampPercent(((PAD_L + slot * active + slot / 2) / W) * 100, 18, 82)}%`}
                top="18%"
              >
                <HoverTip
                  rows={[
                    { swatch: "#16a34a", value: formatChartPesos(selected.current), hint: `${selected.dayNumber} ${selected.monthLabel}` },
                    { swatch: "#d5d8de", value: formatChartPesos(selected.previous), hint: "Período anterior" },
                  ]}
                />
              </TipAnchor>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] text-[#b0b6bf]">La barra gris es el mismo día del período anterior.</p>
        </>
      )}
    </ChartCard>
  );
}
