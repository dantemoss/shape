"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
import { Amount } from "@/components/primitives";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { ChartCard, EmptyChart } from "./ui";
import { CHART_MS, ShapeTooltipContent } from "./shape-tooltip";

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
  const over = shownPct >= 100;
  const color = over ? "var(--chart-2)" : "var(--chart-1)";
  const chartConfig = {
    score: { label: "Del sueldo", color },
  };
  const chartData = [{ name: "sueldo", score: clamped, fill: color }];

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
            <Stat
              dash={over ? "var(--chart-2)" : "var(--chart-1)"}
              label={left >= 0 ? "Te queda" : "De más"}
              value={<Amount value={Math.abs(left)} tone={left >= 0 ? "income" : "expense"} />}
            />
            <Stat dash="#c5cad3" label="Sueldo esperado" value={<Amount value={expected} />} align="right" />
          </div>
          <p className="mb-2 shrink-0 text-[12px] text-[#9aa1ab]">{periodLabel}</p>
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="h-[200px] w-[200px]" role="img" aria-label={`${shownPct} por ciento del sueldo`}>
              <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-[200px] max-w-none">
                <RadialBarChart data={chartData} innerRadius={72} outerRadius={96} barSize={16} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <ChartTooltip
                    content={
                      <ShapeTooltipContent
                        rows={() => [
                          {
                            swatch: color,
                            value: spent,
                            hint: `${shownPct.toLocaleString("es-AR")}% del esperado`,
                            tone: over ? "expense" : "neutral",
                          },
                        ]}
                      />
                    }
                  />
                  <RadialBar
                    dataKey="score"
                    background={{ fill: "#e6e8ee" }}
                    cornerRadius={10}
                    animationDuration={CHART_MS}
                    animationEasing="ease-out"
                  />
                </RadialBarChart>
              </ChartContainer>
            </div>
            <div className="mt-1 shrink-0 text-center">
              <p className="text-[13px] text-[#9aa1ab]">Gastado del sueldo</p>
              <div className="mt-1.5">
                <Amount value={spent} size="hero" tone={over ? "expense" : "neutral"} />
              </div>
              <p className={over ? "mt-1 text-[13px] font-medium text-expense" : "mt-1 text-[13px] font-medium text-income"}>
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
  value: ReactNode;
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
      <div className="mt-1.5 whitespace-nowrap">{value}</div>
    </div>
  );
}
