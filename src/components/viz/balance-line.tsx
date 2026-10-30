"use client";

import { useId, useState } from "react";
import { Landmark } from "lucide-react";
import { formatChartPesos, formatSignedPercent, paddedDomain } from "@/lib/chart-format";
import type { BalancePoint } from "@/lib/chart-series";
import { clampPercent, smoothArea, smoothLine, yAt } from "./geometry";
import { ChartCard, EmptyChart, HeroNumber, HoverTip, TipAnchor } from "./ui";

const W = 360;
const H = 220;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 18;
const PAD_B = 28;

export function BalanceLineCard({ points }: { points: BalancePoint[] }) {
  const uid = useId().replace(/:/g, "");
  const [active, setActive] = useState(Math.max(0, points.length - 1));
  const domain = paddedDomain(points.map((point) => point.balance));
  const plotBottom = H - PAD_B;
  const slot = points.length > 1 ? (W - PAD_L - PAD_R) / (points.length - 1) : 0;
  const coords = points.map((point, index) => ({
    x: PAD_L + slot * index,
    y: yAt(point.balance, domain.min, domain.max, PAD_T, plotBottom),
  }));
  const selected = points[active];
  const selectedPoint = coords[active];
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
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-1 h-10 w-1.5 shrink-0 rounded-full bg-[#c4b5fd]" />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[13px] text-[#9aa1ab]">
                  <Landmark size={13} />
                  Saldo
                </p>
                <HeroNumber className="mt-1">{formatChartPesos(selected?.balance ?? 0)}</HeroNumber>
              </div>
            </div>
            {selected?.changePct != null ? (
              <p className={selected.changePct >= 0 ? "text-[13px] font-semibold text-[#1f9d55]" : "text-[13px] font-semibold text-[#e5484d]"}>
                {formatSignedPercent(selected.changePct)} vs el mes anterior
              </p>
            ) : null}
          </div>
          <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Saldo en el tiempo">
              <defs>
                <linearGradient id={`${uid}-band`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ddd6fe" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#ddd6fe" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`${uid}-line`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              {Array.from({ length: 4 }, (_, index) => {
                const y = PAD_T + ((plotBottom - PAD_T) / 3) * index;
                return <line key={index} x1={0} x2={W} y1={y} y2={y} stroke="#f1f2f4" />;
              })}
              {selectedPoint ? (
                <rect
                  x={selectedPoint.x - slot / 2}
                  y={PAD_T}
                  width={Math.max(slot, 24)}
                  height={plotBottom - PAD_T}
                  fill={`url(#${uid}-band)`}
                />
              ) : null}
              {selectedPoint ? (
                <line x1={selectedPoint.x} x2={selectedPoint.x} y1={PAD_T} y2={plotBottom} stroke="#c4b5fd" strokeDasharray="3 4" />
              ) : null}
              <path d={smoothArea(coords, plotBottom)} fill={`url(#${uid}-band)`} opacity="0.45" />
              <path d={smoothLine(coords)} fill="none" stroke={`url(#${uid}-line)`} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="viz-line" />
              {coords.map((point, index) => (
                <circle key={points[index].key} cx={point.x} cy={point.y} r={index === active ? 4.5 : 3} fill={index === active ? "#8b5cf6" : "#ddd6fe"} stroke="white" strokeWidth="1.5" />
              ))}
              {points.map((point, index) => (
                <g key={`${point.key}-label`}>
                  <text
                    x={coords[index].x}
                    y={H - 8}
                    textAnchor="middle"
                    fill={index === active ? "#7c3aed" : "#c5cad3"}
                    fontSize="11"
                    fontWeight={index === active ? 600 : 500}
                  >
                    {point.label}
                  </text>
                  <rect
                    x={coords[index].x - slot / 2}
                    y={0}
                    width={Math.max(slot, 28)}
                    height={H}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={() => setActive(index)}
                  />
                </g>
              ))}
            </svg>
            {selected && selectedPoint ? (
              <TipAnchor left={`${clampPercent((selectedPoint.x / W) * 100)}%`} top={`${(selectedPoint.y / H) * 100}%`}>
                <HoverTip
                  rows={[
                    { swatch: "#8b5cf6", value: formatChartPesos(selected.balance), hint: "Saldo" },
                    { swatch: "#c4b5fd", value: formatChartPesos(selected.income), hint: "Ingresos" },
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
