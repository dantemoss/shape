"use client";

import Link from "next/link";
import { formatChartPesos } from "@/lib/chart-format";
import type { StripSegment } from "@/lib/chart-series";
import { ChartCard, EmptyChart } from "./ui";

const BARS = 52;

export function CategoryStripCard({
  income,
  expense,
  incomeCount,
  expenseCount,
  segments,
}: {
  income: number;
  expense: number;
  incomeCount: number;
  expenseCount: number;
  segments: StripSegment[];
}) {
  const cuts = segments.map((_, index) =>
    segments.slice(0, index + 1).reduce((sum, segment) => sum + segment.pct, 0)
  );

  return (
    <ChartCard
      title="Por categoría"
      action={
        <Link
          href="/transactions"
          className="inline-flex h-9 items-center rounded-full bg-[#f5f6f8] px-3 text-[13px] font-medium text-[#3a4150] ring-1 ring-black/[0.04]"
        >
          Ver movimientos
        </Link>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-[#9aa1ab]">Ingresos del mes</p>
          <p className="num mt-1 truncate text-[clamp(1.25rem,4.5vw,1.7rem)]">{formatChartPesos(income)}</p>
          <p className="mt-1 text-[12px] font-medium text-[#1f9d55]">+{incomeCount} este mes</p>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] text-[#9aa1ab]">Gastos del mes</p>
          <p className="num mt-1 truncate text-[clamp(1.25rem,4.5vw,1.7rem)]">{formatChartPesos(expense)}</p>
          <p className="mt-1 text-[12px] font-medium text-[#1f9d55]">+{expenseCount} este mes</p>
        </div>
      </div>
      {segments.length === 0 ? (
        <EmptyChart>Sin gastos en pesos este mes.</EmptyChart>
      ) : (
        <>
          <div className="mb-2 flex">
            {segments.map((segment) => (
              <div key={segment.key} style={{ width: `${segment.pct}%` }} className="min-w-0 px-0.5">
                <p className="truncate text-center text-[12px] font-medium text-[#1c1f26]">{segment.label}</p>
                <p className="text-center text-[12px] text-[#9aa1ab]">{segment.pct}%</p>
              </div>
            ))}
          </div>
          <div className="flex h-11 gap-[3px]" aria-hidden>
            {Array.from({ length: BARS }, (_, index) => {
              const at = ((index + 0.5) / BARS) * 100;
              const segmentIndex = Math.max(0, cuts.findIndex((cut) => at <= cut));
              const color = segments[segmentIndex]?.color ?? "#e5e7eb";
              return (
                <span
                  key={index}
                  className="viz-block h-full flex-1 rounded-full"
                  style={{ background: color, animationDelay: `${index * 10}ms` }}
                />
              );
            })}
          </div>
        </>
      )}
    </ChartCard>
  );
}
