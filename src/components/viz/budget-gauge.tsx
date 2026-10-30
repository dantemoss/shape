"use client";

import { useId } from "react";
import Link from "next/link";
import { formatChartPesos, formatSignedPercent } from "@/lib/chart-format";
import { ChartCard, EmptyChart, HeroNumber } from "./ui";

const SEGMENTS = 16;

export function BudgetGaugeCard({
  spent,
  expected,
  left,
  pct,
  periodLabel,
}: {
  spent: number;
  expected: number;
  left: number;
  pct: number;
  periodLabel: string | null;
}) {
  const uid = useId().replace(/:/g, "");
  const filled = Math.max(0, Math.min(SEGMENTS, Math.round((Math.min(pct, 100) / 100) * SEGMENTS)));

  return (
    <ChartCard title="Del sueldo" subtitle="Cuánto del cobro esperado ya se fue" href="/salary">
      {expected <= 0 || !periodLabel ? (
        <EmptyChart>
          <span>
            Configurá el sueldo para ver este medidor.{" "}
            <Link href="/salary" className="font-medium text-[#1c1f26] underline-offset-2 hover:underline">
              Ir a Sueldo
            </Link>
          </span>
        </EmptyChart>
      ) : (
        <div>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-4">
            <Stat dash="#16a34a" label={left >= 0 ? "Te queda" : "De más"} value={formatChartPesos(Math.abs(left))} />
            <Stat dash="#d5d8de" label="Sueldo esperado" value={formatChartPesos(expected)} align="right" />
          </div>
          <p className="mb-1 text-[12px] text-[#9aa1ab]">{periodLabel}</p>
          <div className="relative mx-auto max-w-[360px]">
            <svg viewBox="0 0 360 188" className="h-auto w-full" role="img" aria-label={`${Math.round(pct)} por ciento del sueldo`}>
              <defs>
                <linearGradient id={`${uid}-green`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#166534" />
                  <stop offset="55%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#bbf7d0" />
                </linearGradient>
              </defs>
              {Array.from({ length: SEGMENTS }, (_, index) => {
                const t = (index + 0.5) / SEGMENTS;
                const angle = Math.PI * (1 - t);
                const radius = 128;
                const x = 180 + Math.cos(angle) * radius;
                const y = 168 - Math.sin(angle) * radius;
                const rot = (angle * 180) / Math.PI - 90;
                const on = index < filled;
                return (
                  <rect
                    key={index}
                    x={x - 11}
                    y={y - 18}
                    width="22"
                    height="36"
                    rx="7"
                    fill={on ? `url(#${uid}-green)` : "#eceff3"}
                    transform={`rotate(${rot} ${x} ${y})`}
                    className="viz-segment"
                    style={{ animationDelay: `${index * 28}ms` }}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-x-0 bottom-1 text-center">
              <p className="text-[13px] text-[#9aa1ab]">Gastado del sueldo</p>
              <HeroNumber className="mt-1">{formatChartPesos(spent)}</HeroNumber>
              <p className={pct >= 100 ? "mt-1 text-[13px] font-medium text-[#e5484d]" : "mt-1 text-[13px] font-medium text-[#1f9d55]"}>
                {formatSignedPercent(pct, 0).replace("+", "")} del esperado
              </p>
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  );
}

function Stat({
  dash,
  label,
  value,
  align = "left",
}: {
  dash: string;
  label: string;
  value: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p className="flex items-center gap-1.5 text-[12px] text-[#9aa1ab]" style={{ justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
        <span className="h-[3px] w-3.5 rounded-full" style={{ background: dash }} />
        {label}
      </p>
      <p className="mt-1 text-[clamp(1.15rem,4.6vw,1.6rem)] font-bold tracking-[-0.04em] text-[#16181d] tabular-nums">{value}</p>
    </div>
  );
}
