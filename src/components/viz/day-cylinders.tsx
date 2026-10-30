"use client";

import { useId, useState } from "react";
import {
  Car,
  Clapperboard,
  GraduationCap,
  HeartPulse,
  House,
  PiggyBank,
  RefreshCw,
  Shirt,
  Utensils,
  Wallet,
} from "lucide-react";
import { formatChartPesos } from "@/lib/chart-format";
import type { AlignedDay } from "@/lib/chart-series";
import type { ExpenseCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChartCard, EmptyChart, Segmented, iconWell } from "./ui";

export interface CylinderMovement {
  id: string;
  date: string;
  title: string;
  meta: string;
  amount: number;
  type: "income" | "expense";
  category: ExpenseCategory;
}

const ICONS: Record<ExpenseCategory, typeof Wallet> = {
  housing: House,
  food: Utensils,
  transport: Car,
  entertainment: Clapperboard,
  health: HeartPulse,
  education: GraduationCap,
  subscriptions: RefreshCw,
  clothing: Shirt,
  savings: PiggyBank,
  other: Wallet,
};

const DOT: Record<ExpenseCategory, string> = {
  housing: "#7c6cf0",
  food: "#d08a1f",
  transport: "#d97706",
  entertainment: "#db2777",
  health: "#1f9d55",
  education: "#3b82f6",
  subscriptions: "#ea580c",
  clothing: "#db2777",
  savings: "#1f9d55",
  other: "#6d7480",
};

export function DayCylindersCard({
  days,
  movements,
  periodLabel,
}: {
  days: AlignedDay[];
  movements: CylinderMovement[];
  periodLabel: string | null;
}) {
  const uid = useId().replace(/:/g, "");
  const [mode, setMode] = useState<"week" | "period">("week");
  const elapsed = days.filter((day) => !day.future);
  const shown = mode === "week" ? (elapsed.length > 0 ? elapsed.slice(-7) : days.slice(0, 7)) : days;
  const initialDate = [...shown].reverse().find((day) => day.current > 0)?.date ?? shown[shown.length - 1]?.date ?? "";
  const [activeDate, setActiveDate] = useState(initialDate);
  const selected = shown.find((day) => day.date === activeDate) ?? shown[shown.length - 1];
  const max = Math.max(1, ...shown.map((day) => day.current));
  const dayMoves = movements.filter((movement) => movement.date === selected?.date);

  return (
    <ChartCard
      title="Día por día"
      subtitle={periodLabel ? `Tocá un día · ${periodLabel}` : "Tocá un día para ver sus movimientos"}
      action={
        <Segmented
          label="Alcance del gráfico"
          value={mode}
          onChange={setMode}
          options={[
            { value: "week", label: "Semana" },
            { value: "period", label: "Período" },
          ]}
        />
      }
    >
      {shown.length === 0 ? (
        <EmptyChart>Todavía no hay días en este período.</EmptyChart>
      ) : (
        <>
          <div className="w-full min-w-0 overflow-x-auto">
          <div className={cn("flex items-end gap-1", shown.length > 8 ? "w-max" : "justify-between")}>
            {shown.map((day, index) => {
              const on = day.date === selected?.date;
              const height = Math.max(18, (day.current / max) * 132);
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setActiveDate(day.date)}
                  className={cn("flex flex-col items-center gap-2", shown.length > 8 ? "w-11 shrink-0" : "min-w-0 flex-1")}
                  aria-pressed={on}
                >
                  <span className="relative flex h-[148px] w-full items-end justify-center">
                    {on ? (
                      <span
                        className="absolute bottom-2 h-24 w-10 rounded-full blur-md"
                        style={{ background: "linear-gradient(180deg, rgba(192,132,252,0.0), rgba(125,211,252,0.85))" }}
                      />
                    ) : null}
                    <svg viewBox="0 0 36 148" className="relative h-[148px] w-full max-w-[46px]">
                      <defs>
                        <linearGradient id={`${uid}-${index}`} x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="55%" stopColor="#818cf8" />
                          <stop offset="100%" stopColor="#e879f9" />
                        </linearGradient>
                        <clipPath id={`${uid}-clip-${index}`}>
                          <rect x="6" y="4" width="24" height="140" rx="12" />
                        </clipPath>
                      </defs>
                      <rect x="6" y="4" width="24" height="140" rx="12" fill={on ? "#f4f5f7" : "#f3f4f6"} />
                      {on ? (
                        <rect
                          x="6"
                          y={144 - height}
                          width="24"
                          height={height}
                          rx="12"
                          fill={`url(#${uid}-${index})`}
                          className="viz-bar"
                        />
                      ) : (
                        <rect
                          x="6"
                          y={144 - Math.max(16, height)}
                          width="24"
                          height={Math.max(16, height)}
                          rx="12"
                          fill="#dedfe3"
                          clipPath={`url(#${uid}-clip-${index})`}
                          className="viz-bar"
                          style={{ animationDelay: `${index * 40}ms` }}
                        />
                      )}
                    </svg>
                  </span>
                  <span className={cn("text-[12px] tracking-tight", on ? "font-semibold text-[#1c1f26]" : "text-[#c5cad3]")}>
                    {day.weekday}
                  </span>
                </button>
              );
            })}
          </div>
          </div>

          <div className="mt-4 space-y-2">
            {dayMoves.length === 0 ? (
              <p className="rounded-2xl bg-[#f6f7f9] px-4 py-4 text-[13px] text-[#8d949e]">
                Sin movimientos el {selected ? `${selected.weekday.toLocaleLowerCase("es-AR")} ${selected.dayNumber}` : "día elegido"}.
              </p>
            ) : (
              dayMoves.slice(0, 6).map((movement) => {
                const Icon = movement.type === "income" ? Wallet : ICONS[movement.category];
                return (
                  <div key={movement.id} className="flex items-center gap-3 rounded-2xl bg-[#f6f7f9] px-3 py-3">
                    <span className={cn(iconWell, "size-10")}>
                      <Icon size={16} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-[#1c1f26]">{movement.title}</span>
                      <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-[#9aa1ab]">
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: movement.type === "income" ? "#1f9d55" : DOT[movement.category] }}
                        />
                        <span className="truncate">{movement.meta}</span>
                      </span>
                    </span>
                    <span className={cn("shrink-0 text-[14px] font-semibold tabular-nums", movement.type === "income" ? "text-[#1f9d55]" : "text-[#1c1f26]")}>
                      {movement.type === "expense" ? "−" : "+"}
                      {formatChartPesos(movement.amount)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </ChartCard>
  );
}
