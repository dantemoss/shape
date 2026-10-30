"use client";

import Link from "next/link";
import { formatChartPesos } from "@/lib/chart-format";
import { ChartCard, EmptyChart } from "./ui";

const TICKS = 26;
const CX = 160;
const CY = 118;
const RADIUS = 92;
const TICK_W = 8;
const TICK_H = 18;

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
  const filled = Math.max(0, Math.min(TICKS, Math.round((Math.min(Math.max(pct, 0), 100) / 100) * TICKS)));
  const shownPct = Math.round(pct);

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
          <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
            <Stat dash="#1f9d55" label={left >= 0 ? "Te queda" : "De más"} value={formatChartPesos(Math.abs(left))} />
            <Stat dash="#c5cad3" label="Sueldo esperado" value={formatChartPesos(expected)} align="right" />
          </div>
          <p className="mb-2 text-[12px] text-[#9aa1ab]">{periodLabel}</p>
          <svg viewBox="0 0 320 146" className="mx-auto block h-[132px] w-full max-w-[320px]" role="img" aria-label={`${shownPct} por ciento del sueldo`}>
            {Array.from({ length: TICKS }, (_, index) => {
              const angle = Math.PI * (1 - (index + 0.5) / TICKS);
              const x = CX + Math.cos(angle) * RADIUS;
              const y = CY - Math.sin(angle) * RADIUS;
              const rotation = (angle * 180) / Math.PI - 90;
              return (
                <rect
                  key={index}
                  x={x - TICK_W / 2}
                  y={y - TICK_H / 2}
                  width={TICK_W}
                  height={TICK_H}
                  rx={TICK_W / 2}
                  fill={index < filled ? "#1f9d55" : "#e6e8ee"}
                  transform={`rotate(${rotation} ${x} ${y})`}
                />
              );
            })}
          </svg>
          <div className="mt-1 text-center">
            <p className="text-[13px] text-[#9aa1ab]">Gastado del sueldo</p>
            <p className="num mt-1 text-[clamp(1.55rem,3vw,2rem)] text-[#16181d]">{formatChartPesos(spent)}</p>
            <p className={shownPct >= 100 ? "mt-1 text-[13px] font-medium text-[#e5484d]" : "mt-1 text-[13px] font-medium text-[#1f9d55]"}>
              {shownPct.toLocaleString("es-AR")}% del esperado
            </p>
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
    <div className={align === "right" ? "min-w-0 text-right" : "min-w-0 text-left"}>
      <p
        className="flex items-center gap-1.5 text-[12px] text-[#9aa1ab]"
        style={{ justifyContent: align === "right" ? "flex-end" : "flex-start" }}
      >
        <span className="h-[3px] w-3.5 rounded-full" style={{ background: dash }} />
        {label}
      </p>
      <p className="mt-1 truncate text-[clamp(1.05rem,2.4vw,1.45rem)] font-bold tracking-[-0.04em] text-[#16181d] tabular-nums">
        {value}
      </p>
    </div>
  );
}
