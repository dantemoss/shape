"use client";

import { useId } from "react";
import { formatChartPesos, formatSignedPercent } from "@/lib/chart-format";
import type { MerchantCardModel } from "@/lib/chart-series";
import { smoothArea, smoothLine, yAt } from "./geometry";
import { DeltaPill, EmptyChart } from "./ui";

const COLORS = ["#3b82f6", "#f97316", "#8b5cf6", "#14b8a6"];

export function MerchantCard({ model }: { model: MerchantCardModel }) {
  const uid = useId().replace(/:/g, "");
  const width = 360;
  const height = 92;
  const max = Math.max(1, ...model.spark.map((point) => point.value));
  const coords = model.spark.map((point, index) => ({
    x: (index / Math.max(1, model.spark.length - 1)) * width,
    y: yAt(point.value, 0, max * 1.25, 8, height - 4),
  }));

  return (
    <section className="viz-card overflow-hidden bg-[linear-gradient(180deg,#e7f1ff_0%,#ffffff_46%)] !p-0">
      <div className="px-5 pt-5 sm:px-6">
        <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#1c1f26]">Comercios</h2>
        {model.total <= 0 ? (
          <div className="py-6">
            <EmptyChart>Los gastos con comercio aparecen acá. Si el movimiento no tiene comercio, no entra en esta lista.</EmptyChart>
          </div>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <p className="num text-[clamp(2rem,8vw,3.1rem)] leading-none text-[#16181d]">
                <span className="mr-1 align-top text-[0.42em] font-semibold text-[#9aa1ab]">$</span>
                {formatChartPesos(model.total).replace("$", "")}
              </p>
              {model.todayChangePct != null ? (
                <p className="mb-1 flex items-center gap-1.5 text-[13px]">
                  <DeltaPill value={model.todayChangePct} positiveIsGood={false} />
                  <span className="text-[#9aa1ab]">hoy</span>
                </p>
              ) : null}
            </div>
            <ul className="mt-4 space-y-2.5">
              {model.rows.map((row, index) => (
                <li key={row.name} className="flex items-center gap-3">
                  <span className="h-1 w-4 shrink-0 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                  <span className="min-w-0 flex-1 truncate text-[14px] text-[#3a4150]">{row.name}</span>
                  <span className="shrink-0 text-[14px] font-semibold tabular-nums">{formatChartPesos(row.amount)}</span>
                  {row.changePct != null ? (
                    <span className={row.changePct > 0 ? "w-16 shrink-0 text-right text-[12px] font-medium text-[#e5484d]" : "w-16 shrink-0 text-right text-[12px] font-medium text-[#1f9d55]"}>
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
        <div className="mt-4">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-[92px] w-full" aria-hidden>
            <defs>
              <linearGradient id={`${uid}-spark`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={smoothArea(coords, height)} fill={`url(#${uid}-spark)`} />
            <path d={smoothLine(coords)} fill="none" stroke="#3b82f6" strokeWidth="2.4" className="viz-line" />
          </svg>
          <div className="flex justify-between px-4 pb-3 text-[10px] font-medium tracking-[0.08em] text-[#c5cad3]">
            {model.spark.map((point) => (
              <span key={point.label}>{point.label}</span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
