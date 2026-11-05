"use client";

import { useState, type SVGProps } from "react";
import { useReducedMotion } from "framer-motion";
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
import { Bar, BarChart, XAxis } from "recharts";
import { Amount, CategoryDot } from "@/components/primitives";
import { ChartContainer } from "@/components/ui/chart";
import type { AlignedDay } from "@/lib/chart-series";
import type { ExpenseCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChartCard, EmptyChart, Segmented, iconWell } from "./ui";
import { ChartPlot, chartPlotClass } from "./shape-tooltip";

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

const chartConfig = {
  value: { label: "Gasto", color: "var(--chart-3)" },
};

type DayRow = { date: string; label: string; value: number; future: boolean };

type MonoBarProps = SVGProps<SVGRectElement> & {
  index?: number;
  payload?: DayRow;
  activeIndex?: number;
  onPick?: (index: number) => void;
  background?: { x?: number; y?: number; width?: number; height?: number };
};

function MonoBar({ x, y, width, height, index, payload, activeIndex, onPick, background }: MonoBarProps) {
  const reduced = useReducedMotion();
  const xPos = Number(x ?? 0);
  const yPos = Number(y ?? 0);
  const slot = Number(width ?? 0);
  const bandX = Number(background?.x ?? xPos);
  const bandW = Number(background?.width ?? slot);
  const barHeight = Number(height ?? 0);
  const active = index === activeIndex;
  const collapsed = Math.min(6, slot);
  const barWidth = active ? slot : collapsed;
  const barX = active ? xPos : xPos + (slot - collapsed) / 2;
  const stub = barHeight < 2;
  const visualH = stub ? 4 : barHeight;
  const visualY = stub ? yPos - 4 : yPos;
  const fill = payload?.future ? "#dedfe3" : "var(--color-value)";
  const hitY = Math.min(visualY, yPos) - Math.max(0, 44 - visualH);
  const pick = () => {
    if (index != null) onPick?.(index);
  };

  return (
    <g onClick={pick}>
      <rect x={bandX} y={hitY} width={bandW} height={visualH + (visualY - hitY)} fill="transparent" />
      <rect
        x={barX}
        y={visualY}
        width={barWidth}
        height={visualH}
        rx={3}
        fill={fill}
        pointerEvents="none"
        style={reduced ? undefined : { transition: "x 220ms ease-out, width 220ms ease-out" }}
      />
    </g>
  );
}

export function DayCylindersCard({
  days,
  movements,
  periodLabel,
}: {
  days: AlignedDay[];
  movements: CylinderMovement[];
  periodLabel: string | null;
}) {
  const [mode, setMode] = useState<"week" | "period">("week");
  const elapsed = days.filter((day) => !day.future);
  const shown = mode === "week" ? (elapsed.length > 0 ? elapsed.slice(-7) : days.slice(0, 7)) : days;
  const initialDate = [...shown].reverse().find((day) => day.current > 0)?.date ?? shown[shown.length - 1]?.date ?? "";
  const [activeDate, setActiveDate] = useState(initialDate);
  const selected = shown.find((day) => day.date === activeDate) ?? shown[shown.length - 1];
  const activeIndex = Math.max(0, shown.findIndex((day) => day.date === selected?.date));
  const rows: DayRow[] = shown.map((day) => ({
    date: day.date,
    label: mode === "week" ? day.weekday : day.dayNumber,
    value: day.current,
    future: day.future,
  }));
  const dayMoves = movements.filter((movement) => movement.date === selected?.date);
  const interval = rows.length > 16 ? 2 : rows.length > 10 ? 1 : 0;

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
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className="w-full overflow-x-auto rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            tabIndex={0}
            role="group"
            aria-label="Gasto de cada día. Usá las flechas para cambiar de día."
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const next = event.key === "ArrowRight" ? activeIndex + 1 : activeIndex - 1;
              const row = rows[Math.max(0, Math.min(rows.length - 1, next))];
              if (row) setActiveDate(row.date);
            }}
          >
          <div className="h-[180px]" style={rows.length > 12 ? { width: rows.length * 32 } : undefined}>
          <ChartPlot label="Gasto de cada día" className="h-[180px] min-h-[180px]">
            <ChartContainer config={chartConfig} className={cn(chartPlotClass, "h-[180px] min-h-[180px]")}>
              <BarChart accessibilityLayer data={rows} margin={{ top: 12, right: 4, bottom: 0, left: 4 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={interval} />
                <Bar
                  dataKey="value"
                  fill="var(--color-value)"
                  maxBarSize={36}
                  isAnimationActive={false}
                  shape={<MonoBar activeIndex={activeIndex} onPick={(index) => setActiveDate(rows[index]?.date ?? activeDate)} />}
                />
              </BarChart>
            </ChartContainer>
          </ChartPlot>
          </div>
          </div>

          <div className="mt-auto space-y-2 pt-4" aria-live="polite">
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
                        <CategoryDot color={movement.type === "income" ? "#1f9d55" : DOT[movement.category]} />
                        <span className="truncate">{movement.meta}</span>
                      </span>
                    </span>
                    <Amount
                      value={movement.amount}
                      size="secondary"
                      tone={movement.type === "income" ? "income" : "neutral"}
                      signed
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
