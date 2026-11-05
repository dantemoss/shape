"use client";

import Link from "next/link";
import { Amount, Stat, StatRow } from "@/components/primitives";
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
      <StatRow columns={2} className="mb-4">
        <Stat label="Ingresos del mes" value={<Amount value={income} tone="income" />} hint={`+${incomeCount} este mes`} />
        <Stat label="Gastos del mes" value={<Amount value={expense} tone="expense" />} hint={`+${expenseCount} este mes`} />
      </StatRow>
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
          <div className="flex h-11 gap-[3px]" data-shape-pointer="" aria-hidden>
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
