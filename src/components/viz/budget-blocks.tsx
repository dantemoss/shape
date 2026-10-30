"use client";

import Link from "next/link";
import { formatChartPesos } from "@/lib/chart-format";
import { ChartCard, EmptyChart } from "./ui";

const BLOCKS = 42;

export function BudgetBlocksCard({
  spent,
  expected,
  left,
  daysLeft,
  perDay,
}: {
  spent: number;
  expected: number;
  left: number;
  daysLeft: number;
  perDay: number;
}) {
  if (expected <= 0) {
    return (
      <ChartCard title="Para llegar al cobro" subtitle="Lo que queda del sueldo, por día">
        <EmptyChart>
          <Link href="/salary" className="font-medium text-[#1c1f26] underline-offset-2 hover:underline">
            Cargá el sueldo esperado
          </Link>{" "}
          para ver cuánto podés gastar por día.
        </EmptyChart>
      </ChartCard>
    );
  }

  const ratio = Math.max(0, Math.min(1, spent / expected));
  const filled = Math.round(ratio * BLOCKS);
  const within = left >= 0;

  return (
    <ChartCard title="Para llegar al cobro" href="/transactions">
      <div className="flex items-baseline justify-between gap-3 text-[13px] text-[#8d949e]">
        <p className="min-w-0">
          Gastado: <span className="font-semibold text-[#1c1f26]">{formatChartPesos(spent)}</span>
        </p>
        <p className="shrink-0">
          Tope: <span className="font-semibold text-[#1c1f26]">{formatChartPesos(expected)}</span>
        </p>
      </div>
      <div className="mt-3 flex gap-[3px]" aria-hidden>
        {Array.from({ length: BLOCKS }, (_, index) => (
          <span
            key={index}
            className="viz-block h-3.5 flex-1 rounded-[4px]"
            style={{
              background: index < filled ? "#f97316" : "#f1f2f4",
              animationDelay: `${index * 12}ms`,
            }}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold tracking-tight text-[#1c1f26]">
            {within ? "Vas bien dentro del sueldo" : "Te pasaste del sueldo esperado"}
          </p>
          <p className="mt-0.5 text-[13px] text-[#8d949e]">
            {within
              ? `Te quedan ${formatChartPesos(left)} para ${daysLeft} ${daysLeft === 1 ? "día" : "días"} → ${formatChartPesos(perDay)}/día`
              : `Llevás ${formatChartPesos(Math.abs(left))} de más`}
          </p>
        </div>
        <Link
          href="/transactions"
          className="inline-flex h-10 shrink-0 items-center rounded-full bg-[#ff7a1a] px-5 text-[14px] font-semibold text-white shadow-[0_8px_18px_rgba(255,122,26,0.28)]"
        >
          Detalle
        </Link>
      </div>
    </ChartCard>
  );
}
