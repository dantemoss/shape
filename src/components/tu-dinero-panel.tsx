"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
import { Amount } from "@/components/primitives";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { addMonthsISO, monthKey } from "@/lib/dates";
import {
  expensePaceHint,
  getMonthComparison,
  getRecurringExpenses,
  scoreFor,
  scoreLabel,
  signedWholePercent,
} from "@/lib/health-utils";
import { useShapeStore } from "@/lib/store";
import { useMoneySnapshot } from "@/lib/use-money";
import { cn } from "@/lib/utils";

const INK = "#171717";
const TRACK = "oklch(0.94 0.004 260)";
const EXPENSE_BAR = "oklch(0.72 0.09 25)";
const RING_MS = 250;

const ringConfig = {
  score: { label: "Salud", color: INK },
} satisfies ChartConfig;

function monthTitle(key: string): string {
  const [yearText, monthText] = key.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!year || !month) return key;
  const date = new Date(Date.UTC(year, month - 1, 15));
  const name = new Intl.DateTimeFormat("es-AR", { month: "long", timeZone: "UTC" }).format(date);
  return `${name.charAt(0).toLocaleUpperCase("es-AR")}${name.slice(1)} ${year}`;
}

function monthName(key: string): string {
  const [yearText, monthText] = key.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!year || !month) return key;
  const date = new Date(Date.UTC(year, month - 1, 15));
  return new Intl.DateTimeFormat("es-AR", { month: "long", timeZone: "UTC" }).format(date);
}

function formatUsd(income: number, expense: number): string {
  const parts: string[] = [];
  if (income > 0) parts.push(`+US$${income.toLocaleString("es-AR")}`);
  if (expense > 0) parts.push(`−US$${expense.toLocaleString("es-AR")}`);
  return parts.join(" ");
}

function Grain() {
  const raw = useId().replace(/:/g, "");
  const id = `tu-dinero-grain-${raw}`;
  return (
    <svg aria-hidden className="tu-dinero-grain pointer-events-none absolute inset-0 -z-10 h-full w-full">
      <filter id={id} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.09  0 0 0 0 0.09  0 0 0 0 0.09  2.6 0 0 0 -1.25"
        />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} opacity="0.08" />
    </svg>
  );
}

function HealthRing({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const data = useMemo(() => [{ name: "salud", score: clamped, fill: INK }], [clamped]);

  return (
    <div className="relative size-[76px] @min-[720px]:size-[136px]" aria-hidden>
      <ChartContainer
        config={ringConfig}
        initialDimension={{ width: 136, height: 136 }}
        className="aspect-auto size-full max-w-none [&_.recharts-radial-bar-background-sector]:fill-[oklch(0.94_0.004_260)]"
      >
        <RadialBarChart
          data={data}
          innerRadius="71%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          barSize={10}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="score"
            background={{ fill: TRACK }}
            cornerRadius={8}
            animationDuration={RING_MS}
            animationEasing="ease-out"
            isAnimationActive="auto"
          />
        </RadialBarChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-semibold leading-none tracking-[-0.04em] text-[#171717] tabular-nums @min-[720px]:text-[38px]">
          {score.toLocaleString("es-AR")}
        </span>
        <span className="mt-1 hidden text-[12px] text-muted-foreground @min-[720px]:block">de 100</span>
      </div>
    </div>
  );
}

function SplitBar({
  income,
  expense,
  className,
}: {
  income: number;
  expense: number;
  className?: string;
}) {
  const [hot, setHot] = useState<"income" | "expense" | null>(null);
  const total = income + expense;
  const incomePct = total > 0 ? Math.round((income / total) * 100) : 0;
  const expensePct = total > 0 ? Math.max(0, 100 - incomePct) : 0;

  return (
    <div className={className} onMouseLeave={() => setHot(null)}>
      <div
        className="flex h-2 w-full gap-[3px]"
        role="img"
        aria-label={
          total > 0
            ? `Ingresos ${incomePct.toLocaleString("es-AR")}%, gastos ${expensePct.toLocaleString("es-AR")}% del movimiento del mes`
            : "Sin ingresos ni gastos este mes"
        }
      >
        {total <= 0 ? (
          <div className="h-full min-w-0 flex-1 rounded-full" style={{ background: TRACK }} />
        ) : (
          <>
            {income > 0 ? (
              <div
                className="tu-dinero-seg h-full min-w-1 rounded-full bg-income"
                style={{
                  flexGrow: income,
                  flexBasis: 0,
                  opacity: hot === "expense" ? 0.35 : 1,
                }}
                onMouseEnter={() => setHot("income")}
              />
            ) : null}
            {expense > 0 ? (
              <div
                className="tu-dinero-seg h-full min-w-1 rounded-full"
                style={{
                  flexGrow: expense,
                  flexBasis: 0,
                  background: EXPENSE_BAR,
                  opacity: hot === "income" ? 0.35 : 1,
                }}
                onMouseEnter={() => setHot("expense")}
              />
            ) : null}
          </>
        )}
      </div>
      <div className="mt-3.5 grid grid-cols-2 gap-4 @min-[720px]:mt-4 @min-[720px]:gap-6">
        <Legend
          label="Ingresos"
          dotClass="bg-income"
          dim={hot === "expense"}
          onHover={() => setHot("income")}
          value={<Amount value={income} tone="income" size="primary" className="text-[20px] tracking-[-0.03em] @min-[720px]:text-[24px]" />}
        />
        <Legend
          label="Gastos"
          dotClass="bg-expense"
          dim={hot === "income"}
          onHover={() => setHot("expense")}
          value={<Amount value={expense} tone="expense" size="primary" className="text-[20px] tracking-[-0.03em] @min-[720px]:text-[24px]" />}
        />
      </div>
    </div>
  );
}

function Legend({
  label,
  dotClass,
  value,
  dim,
  onHover,
}: {
  label: string;
  dotClass: string;
  value: ReactNode;
  dim: boolean;
  onHover: () => void;
}) {
  return (
    <div
      className="tu-dinero-fade min-w-0"
      style={{ opacity: dim ? 0.35 : 1 }}
      onMouseEnter={onHover}
    >
      <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dotClass)} />
        {label}
      </p>
      <div className="mt-1 @min-[720px]:mt-1.5">{value}</div>
    </div>
  );
}

export function TuDineroPanel({ className }: { className?: string }) {
  const transactions = useShapeStore((s) => s.transactions);
  const salary = useShapeStore((s) => s.salaryConfig?.amount ?? 0);
  const snapshot = useMoneySnapshot();

  const monthComp = useMemo(
    () => getMonthComparison(transactions, snapshot.today),
    [transactions, snapshot.today]
  );
  const recurring = useMemo(() => getRecurringExpenses(transactions), [transactions]);
  const recurringMonthly = Math.round(recurring.reduce((sum, item) => sum + item.avgAmount, 0));

  const spendPct = snapshot.payPeriod
    ? Math.round(snapshot.payPeriod.spendPct)
    : salary > 0
      ? Math.round((snapshot.calendarMonth.expense / salary) * 100)
      : 0;
  const score = transactions.length > 0 ? scoreFor(spendPct) : 0;
  const label = scoreLabel(score);
  const tone = score >= 65 ? "text-income" : score >= 45 ? "text-[#d97706]" : "text-[#e5484d]";

  const month = snapshot.calendarMonth.key;
  const prevKey = (monthKey(addMonthsISO(snapshot.today, -1)) ?? "").slice(0, 7);
  const comparable = monthComp.previous > 0;
  const pace = comparable ? signedWholePercent(monthComp.changePercent) : "—";
  const paceTone =
    !comparable || monthComp.change === 0
      ? "text-[#1c1f26]"
      : monthComp.change > 0
        ? "text-expense"
        : "text-income";
  const barValue = Math.min(100, Math.max(0, spendPct));
  const usd = snapshot.usd.income > 0 || snapshot.usd.expense > 0;

  return (
    <section
      aria-labelledby="tu-dinero"
      className={cn(
        "@container relative isolate overflow-hidden rounded-[26px] border border-border bg-white sm:rounded-[28px]",
        className
      )}
    >
      <Grain />

      <div className="relative flex items-center justify-between gap-3 px-5 pt-5 @min-[720px]:px-7 @min-[720px]:pt-6">
        <h2 id="tu-dinero" className="text-[17px] font-semibold tracking-[-0.03em] text-[#1c1f26]">
          Tu dinero
        </h2>
        <Select value={month} onValueChange={() => undefined}>
          <SelectTrigger
            size="sm"
            aria-label="Mes"
            className="h-8! gap-1.5 rounded-[10px] border-border bg-white px-3 text-[13px] font-medium whitespace-nowrap text-[#1c1f26] shadow-none hover:bg-white"
          >
            <SelectValue>{monthTitle(month)}</SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value={month}>{monthTitle(month)}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-5 pt-5 pb-5 @min-[720px]:grid-cols-[200px_auto_minmax(0,1fr)] @min-[720px]:gap-x-10 @min-[720px]:gap-y-6 @min-[720px]:px-7 @min-[720px]:pt-4 @min-[720px]:pb-7">
        <div className="order-2 flex flex-col items-center @min-[720px]:order-1">
          <HealthRing score={score} />
          <p className="mt-2 text-center text-[13px] text-muted-foreground @min-[720px]:mt-3">
            Salud <span className={cn("font-medium", tone)}>{label}</span>
            <span className="sr-only">, {score.toLocaleString("es-AR")} de 100</span>
          </p>
        </div>

        <Separator
          orientation="vertical"
          className="order-2 hidden self-stretch bg-border @min-[720px]:order-2 @min-[720px]:block"
        />

        <div className="order-1 min-w-0 @min-[720px]:order-3">
          <p className="text-[13px] text-muted-foreground">Saldo real</p>
          <div className="mt-1.5">
            {snapshot.account.hasBaseline ? (
              <Amount
                value={snapshot.account.balance}
                tone={snapshot.account.balance < 0 ? "expense" : "neutral"}
                size="hero"
                animate
                className="text-[clamp(1.7rem,10cqi,2.375rem)] @min-[720px]:text-[52px]"
              />
            ) : (
              <p className="text-[clamp(1.7rem,10cqi,2.375rem)] font-semibold leading-none tracking-[-0.045em] text-[#1c1f26]">
                Sin cargar
              </p>
            )}
          </div>
          {usd ? (
            <p className="mt-2 hidden text-[13px] leading-snug text-[#6d7480] tabular-nums @min-[720px]:block">
              USD aparte {formatUsd(snapshot.usd.income, snapshot.usd.expense)}. No entra al saldo.
            </p>
          ) : null}
          <SplitBar
            className="mt-6 hidden @min-[720px]:block"
            income={snapshot.calendarMonth.income}
            expense={snapshot.calendarMonth.expense}
          />
        </div>

        {usd ? (
          <p className="order-3 col-span-2 text-[13px] leading-snug text-[#6d7480] tabular-nums @min-[720px]:hidden">
            USD aparte {formatUsd(snapshot.usd.income, snapshot.usd.expense)}. No entra al saldo.
          </p>
        ) : null}
        <SplitBar
          className="order-3 col-span-2 @min-[720px]:hidden"
          income={snapshot.calendarMonth.income}
          expense={snapshot.calendarMonth.expense}
        />
      </div>

      <div className="relative grid divide-y divide-border border-t border-border @min-[720px]:grid-cols-3 @min-[720px]:divide-x @min-[720px]:divide-y-0">
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 @min-[720px]:block @min-[720px]:px-7 @min-[720px]:py-5">
          <p className="text-[13px] text-muted-foreground">Gastos vs. {monthName(prevKey)}</p>
          <div className="text-right @min-[720px]:mt-2 @min-[720px]:text-left">
            <p className={cn("text-[17px] font-semibold leading-none tracking-[-0.03em] tabular-nums @min-[720px]:text-[24px]", paceTone)}>
              {pace}
            </p>
            <p className="mt-1 hidden text-[13px] text-muted-foreground @min-[720px]:block">
              {expensePaceHint(monthComp.current, monthComp.previous)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-3.5 @min-[720px]:block @min-[720px]:px-7 @min-[720px]:py-5">
          <p className="text-[13px] text-muted-foreground">Recurrentes</p>
          <div className="text-right @min-[720px]:mt-2 @min-[720px]:text-left">
            <p className="text-[17px] font-semibold leading-none tracking-[-0.03em] text-[#1c1f26] tabular-nums @min-[720px]:text-[24px]">
              {recurring.length.toLocaleString("es-AR")}
              {recurring.length > 0 ? (
                <span className="ml-1.5 text-[13px] font-normal tracking-normal text-muted-foreground @min-[720px]:hidden">
                  · <Amount value={recurringMonthly} size="secondary" className="text-[13px] font-normal tracking-normal text-muted-foreground" />
                  /mes
                </span>
              ) : null}
            </p>
            <p className="mt-1 hidden text-[13px] text-muted-foreground @min-[720px]:block">
              {recurring.length > 0 ? (
                <>
                  <Amount value={recurringMonthly} size="secondary" className="text-[13px] font-normal tracking-normal text-muted-foreground" />
                  {" "}por mes
                </>
              ) : (
                "Sin patrón"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 px-5 py-3.5 @min-[720px]:block @min-[720px]:px-7 @min-[720px]:py-5">
          <p className="shrink-0 text-[13px] text-muted-foreground">Del sueldo</p>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3 @min-[720px]:mt-2 @min-[720px]:w-full @min-[720px]:flex-col @min-[720px]:items-stretch">
            <p className="order-2 text-[17px] font-semibold leading-none tracking-[-0.03em] text-[#1c1f26] tabular-nums @min-[720px]:order-1 @min-[720px]:text-[24px]">
              {spendPct.toLocaleString("es-AR")}%
            </p>
            <Progress
              value={barValue}
              aria-label={`${spendPct.toLocaleString("es-AR")}% del sueldo`}
              className="tu-dinero-meter order-1 w-24 shrink-0 gap-0 @min-[720px]:order-2 @min-[720px]:mt-2.5 @min-[720px]:w-full"
            />
            {salary <= 0 ? (
              <p className="order-3 text-[13px] text-muted-foreground @min-[720px]:mt-1">Sin sueldo</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
