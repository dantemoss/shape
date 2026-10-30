"use client";

import { useId, useState } from "react";
import { formatAxisPesos, formatChartPesos, niceCeiling } from "@/lib/chart-format";
import type { MonthFlowPoint } from "@/lib/chart-series";
import { clampPercent, topRoundedBar, yAt } from "./geometry";
import { ChartCard, EmptyChart, HeroNumber, HoverTip, TipAnchor, chartPlotFrameClass, chartPlotSvgClass, useChartPlot } from "./ui";

const W = 360;
const PAD_L = 6;
const PAD_R = 52;
const PAD_T = 16;
const PAD_B = 28;

export function MonthlyBarsCard({ points }: { points: MonthFlowPoint[] }) {
  const uid = useId().replace(/:/g, "");
  const [active, setActive] = useState(Math.max(0, points.length - 1));
  const plot = useChartPlot(W);
  const H = plot.height;
  const max = Math.max(1, ...points.flatMap((point) => [point.income, point.expense]));
  const { top, ticks } = niceCeiling(max, 4);
  const plotBottom = H - PAD_B;
  const plotW = W - PAD_L - PAD_R;
  const groupW = points.length > 0 ? plotW / points.length : plotW;
  const barW = Math.min(18, Math.max(8, groupW * 0.26));
  const selected = points[active];

  return (
    <ChartCard
      title="Flujo de caja"
      subtitle="Ingresos y gastos en pesos, mes a mes"
      href="/transactions"
    >
      {points.every((point) => point.income === 0 && point.expense === 0) ? (
        <EmptyChart>Cuando cargues movimientos en pesos, el mes se dibuja acá.</EmptyChart>
      ) : (
        <>
          {selected ? (
            <div className="mb-3 grid shrink-0 grid-cols-2 gap-3">
              <div className="min-w-0">
                <p className="text-[13px] text-[#9aa1ab]">Ingresos · {selected.label}</p>
                <HeroNumber className="mt-1 text-[clamp(1.35rem,5vw,2rem)]">{formatChartPesos(selected.income)}</HeroNumber>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] text-[#9aa1ab]">Gastos · {selected.label}</p>
                <HeroNumber className="mt-1 text-[clamp(1.35rem,5vw,2rem)]">{formatChartPesos(selected.expense)}</HeroNumber>
              </div>
            </div>
          ) : null}
          <div ref={plot.ref} className={chartPlotFrameClass}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={chartPlotSvgClass} role="img" aria-label="Ingresos y gastos por mes">
            <defs>
              <linearGradient id={`${uid}-grey`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f7f8fa" />
                <stop offset="100%" stopColor="#e7eaee" />
              </linearGradient>
              <linearGradient id={`${uid}-in`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7ee0ff" />
                <stop offset="55%" stopColor="#3aa0ff" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id={`${uid}-out`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f0abfc" />
                <stop offset="45%" stopColor="#d946ef" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            {ticks.map((tick) => {
              const y = yAt(tick, 0, top, PAD_T, plotBottom);
              return (
                <g key={tick}>
                  <line x1={PAD_L} x2={W - PAD_R + 6} y1={y} y2={y} stroke="#eef0f3" strokeWidth="1" />
                  <text x={W - 2} y={y + 4} textAnchor="end" fill="#c5cad3" fontSize="11">
                    {formatAxisPesos(tick)}
                  </text>
                </g>
              );
            })}
            {points.map((point, index) => {
              const center = PAD_L + groupW * index + groupW / 2;
              const xIn = center - barW - 2;
              const xOut = center + 2;
              const hIn = (point.income / top) * (plotBottom - PAD_T);
              const hOut = (point.expense / top) * (plotBottom - PAD_T);
              const on = index === active;
              return (
                <g key={point.key}>
                  <path
                    d={topRoundedBar(xIn, plotBottom - hIn, barW, hIn, 8)}
                    fill={on ? `url(#${uid}-in)` : `url(#${uid}-grey)`}
                    className="viz-bar"
                    style={{ animationDelay: `${index * 45}ms` }}
                  />
                  <path
                    d={topRoundedBar(xOut, plotBottom - hOut, barW, hOut, 8)}
                    fill={on ? `url(#${uid}-out)` : `url(#${uid}-grey)`}
                    className="viz-bar"
                    style={{ animationDelay: `${index * 45 + 70}ms` }}
                  />
                  {on ? <Sparkles x={xIn} y={plotBottom - hIn} width={barW} height={hIn} /> : null}
                  {on ? <Sparkles x={xOut} y={plotBottom - hOut} width={barW} height={hOut} /> : null}
                  <text
                    x={center}
                    y={H - 8}
                    textAnchor="middle"
                    fill={on ? "#1c1f26" : "#c5cad3"}
                    fontSize="12"
                    fontWeight={on ? 600 : 500}
                  >
                    {point.label}
                  </text>
                  <rect
                    x={PAD_L + groupW * index}
                    y={PAD_T}
                    width={groupW}
                    height={plotBottom - PAD_T + 24}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={() => setActive(index)}
                  >
                    <title>{point.label}</title>
                  </rect>
                </g>
              );
            })}
          </svg>
          {selected ? (
            <TipAnchor
              left={`${clampPercent(((PAD_L + groupW * active + groupW / 2) / W) * 100)}%`}
              top={`${((plotBottom - Math.max((selected.income / top) * (plotBottom - PAD_T), (selected.expense / top) * (plotBottom - PAD_T))) / H) * 100}%`}
            >
              <HoverTip
                rows={[
                  { swatch: "#3aa0ff", value: formatChartPesos(selected.income), hint: "Ingresos" },
                  { swatch: "#d946ef", value: formatChartPesos(selected.expense), hint: "Gastos" },
                ]}
              />
            </TipAnchor>
          ) : null}
          </div>
          <p className="mt-1 shrink-0 text-[11px] text-[#b0b6bf]">Tocá un mes para ver ingresos y gastos.</p>
        </>
      )}
    </ChartCard>
  );
}

function Sparkles({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  if (height < 28) return null;
  const dots = [
    [0.3, 0.22],
    [0.62, 0.38],
    [0.42, 0.58],
    [0.7, 0.72],
  ];
  return (
    <g>
      {dots.map(([px, py], index) => (
        <circle
          key={index}
          cx={x + width * px}
          cy={y + height * py}
          r={index === 0 ? 1.4 : 1}
          fill="white"
          opacity={0.85}
        />
      ))}
    </g>
  );
}
