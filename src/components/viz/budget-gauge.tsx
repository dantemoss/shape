"use client";

import Link from "next/link";
import { formatChartPesos } from "@/lib/chart-format";
import { ChartCard, EmptyChart } from "./ui";

const CX = 160;
const CY = 104;
const RADIUS = 78;
const STROKE = 18;
const ARC = `M ${CX - RADIUS} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${CX + RADIUS} ${CY}`;
const ARC_LENGTH = Math.PI * RADIUS;

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
  const clamped = Math.min(Math.max(pct, 0), 100);
  const shownPct = Math.round(pct);
  const progress = (clamped / 100) * ARC_LENGTH;
  const progressColor = shownPct >= 100 ? "#e5484d" : "#1f9d55";

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
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-3 flex shrink-0 flex-wrap items-end justify-between gap-4">
            <Stat dash="#1f9d55" label={left >= 0 ? "Te queda" : "De más"} value={formatChartPesos(Math.abs(left))} />
            <Stat dash="#c5cad3" label="Sueldo esperado" value={formatChartPesos(expected)} align="right" />
          </div>
          <p className="mb-2 shrink-0 text-[12px] text-[#9aa1ab]">{periodLabel}</p>
          <div className="flex flex-1 flex-col justify-end">
          <svg viewBox="0 0 320 124" className="mx-auto block h-[118px] w-full max-w-[340px]" role="img" aria-label={`${shownPct} por ciento del sueldo`}>
            <path
              d={ARC}
              fill="none"
              stroke="#e6e8ee"
              strokeWidth={STROKE}
              strokeLinecap="round"
            />
            {progress > 0 ? (
              <path
                d={ARC}
                fill="none"
                stroke={progressColor}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${progress} ${ARC_LENGTH}`}
              />
            ) : null}
          </svg>
          <div className="mt-1 shrink-0 text-center">
            <p className="text-[13px] text-[#9aa1ab]">Gastado del sueldo</p>
            <p className="num mt-1 text-[clamp(1.55rem,3vw,2rem)] text-[#16181d]">{formatChartPesos(spent)}</p>
            <p className={shownPct >= 100 ? "mt-1 text-[13px] font-medium text-[#e5484d]" : "mt-1 text-[13px] font-medium text-[#1f9d55]"}>
              {shownPct.toLocaleString("es-AR")}% del esperado
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
