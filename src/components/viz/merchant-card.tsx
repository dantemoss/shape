"use client";

import { useId } from "react";
import { Area, AreaChart } from "recharts";
import { Amount } from "@/components/primitives";
import { ChartContainer } from "@/components/ui/chart";
import { formatSignedPercent } from "@/lib/chart-format";
import type { MerchantCardModel } from "@/lib/chart-series";
import { EmptyChart } from "./ui";
import { CHART_MS, SignedPercent } from "./shape-tooltip";

const COLORS = ["#3b82f6", "#f97316", "#2F48A1", "#14b8a6"];

const chartConfig = {
  value: { label: "Gasto", color: "var(--chart-3)" },
};

export function MerchantCard({ model }: { model: MerchantCardModel }) {
  const uid = useId().replace(/:/g, "");

  return (
    <section className="viz-card flex h-full flex-col overflow-hidden !p-0">
      <div className="flex flex-1 flex-col px-5 pt-5 sm:px-6">
        <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#1c1f26]">Comercios</h2>
        {model.total <= 0 ? (
          <div className="py-6">
            <EmptyChart>Los gastos con comercio aparecen acá. Si el movimiento no tiene comercio, no entra en esta lista.</EmptyChart>
          </div>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <Amount value={model.total} size="hero" />
              {model.todayChangePct != null ? (
                <p className="mb-1 flex items-center gap-1.5 text-[13px]">
                  <SignedPercent value={model.todayChangePct} positiveIsGood={false} />
                  <span className="text-[#9aa1ab]">hoy</span>
                </p>
              ) : null}
            </div>
            <ul className="mt-4 space-y-2.5">
              {model.rows.map((row, index) => (
                <li key={row.name} className="flex items-center gap-3">
                  <span className="h-1 w-4 shrink-0 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                  <span className="min-w-0 flex-1 truncate text-[14px] text-[#3a4150]">{row.name}</span>
                  <Amount value={row.amount} size="secondary" />
                  {row.changePct != null ? (
                    <span
                      className={
                        row.changePct > 0
                          ? "w-16 shrink-0 text-right text-[12px] font-medium text-expense"
                          : "w-16 shrink-0 text-right text-[12px] font-medium text-income"
                      }
                    >
                      {formatSignedPercent(row.changePct, 0)}
                    </span>
                  ) : (
                    <span className="w-16 shrink-0" />
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {model.total > 0 ? (
        <div className="mt-auto pt-4">
          <ChartContainer config={chartConfig} className="aspect-auto h-[92px] w-full max-w-none">
            <AreaChart accessibilityLayer data={model.spark} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`${uid}-spark`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area
                dataKey="value"
                type="natural"
                fill={`url(#${uid}-spark)`}
                stroke="var(--color-value)"
                strokeWidth={2}
                animationDuration={CHART_MS}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ChartContainer>
          <div className="flex justify-between px-4 pb-3 text-[12px] text-[#9aa1ab]">
            {model.spark.map((point) => (
              <span key={point.label}>{point.label.charAt(0)}{point.label.slice(1).toLocaleLowerCase("es-AR")}</span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
