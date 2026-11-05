"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Lightbulb, RefreshCw } from "lucide-react";
import { Amount, Card, CategoryDot, EmptyState, IconWell, ListRow, PageHeader } from "@/components/primitives";
import { TuDineroPanel } from "@/components/tu-dinero-panel";
import { BalanceLineCard } from "@/components/viz/balance-line";
import { CategoryStripCard } from "@/components/viz/category-strip";
import { FlowAreaCard } from "@/components/viz/flow-area";
import { addMonthsISO } from "@/lib/dates";
import {
  balanceSeries,
  categoryStrip,
  periodArea,
} from "@/lib/chart-series";
import { getCategoryBreakdown, getRecurringExpenses, generateInsights } from "@/lib/health-utils";
import { isArsTransaction } from "@/lib/money";
import { useShapeStore } from "@/lib/store";
import { CATEGORY_LABELS } from "@/lib/types";
import { useMoneySnapshot } from "@/lib/use-money";
import { cn } from "@/lib/utils";

const INSIGHT = {
  warning: { icon: AlertTriangle, box: "bg-[#f6f7f9]", dot: "#e5484d" },
  tip: { icon: Lightbulb, box: "bg-[#f6f7f9]", dot: "#6d7480" },
  positive: { icon: CheckCircle2, box: "bg-[#f6f7f9]", dot: "#1f9d55" },
} as const;

export default function HealthPage() {
  const allTx = useShapeStore((s) => s.transactions);
  const salaryConfig = useShapeStore((s) => s.salaryConfig);
  const account = useShapeStore((s) => s.account);
  const adjustments = useShapeStore((s) => s.adjustments);
  const snapshot = useMoneySnapshot();
  const salary = salaryConfig?.amount ?? 0;
  const baseline = useMemo(
    () => (account ? { startingBalance: account.startingBalance, startingDate: account.startingDate } : null),
    [account]
  );

  const monthTx = useMemo(
    () => allTx.filter((transaction) => transaction.date.slice(0, 7) === snapshot.calendarMonth.key),
    [allTx, snapshot.calendarMonth.key]
  );
  const recurring = useMemo(() => getRecurringExpenses(allTx), [allTx]);
  const periodExpense = snapshot.payPeriod?.expense ?? snapshot.calendarMonth.expense;
  const insights = useMemo(
    () =>
      generateInsights(allTx, salary, {
        periodExpenseTotal: periodExpense,
        periodLabel: snapshot.payPeriod ? "período de cobro" : "mes calendario",
      }),
    [allTx, periodExpense, salary, snapshot.payPeriod]
  );
  const points = useMemo(
    () => balanceSeries(baseline, allTx, adjustments, snapshot.today, 8),
    [adjustments, allTx, baseline, snapshot.today]
  );

  const areaStart = snapshot.payPeriod?.start ?? `${snapshot.calendarMonth.key}-01`;
  const areaEnd = snapshot.payPeriod?.end ?? addMonthsISO(areaStart, 1);
  const area = useMemo(
    () => periodArea(baseline, allTx, adjustments, areaStart, areaEnd, snapshot.today),
    [adjustments, allTx, areaEnd, areaStart, baseline, snapshot.today]
  );
  const areaDelta = useMemo(() => {
    const last = [...area].reverse().find((point) => point.current != null);
    if (!last || last.current == null || last.previous === 0) return null;
    return ((last.current - last.previous) / Math.abs(last.previous)) * 100;
  }, [area]);

  const strip = useMemo(
    () => categoryStrip(allTx, `${snapshot.calendarMonth.key}-01`, snapshot.today),
    [allTx, snapshot.calendarMonth.key, snapshot.today]
  );
  const counted = monthTx.filter((transaction) => isArsTransaction(transaction));
  const incomeCount = counted.filter((transaction) => transaction.type === "income").length;
  const expenseCount = counted.filter((transaction) => transaction.type === "expense").length;

  if (allTx.length === 0) {
    return (
      <div className="min-w-0">
        <PageHeader title="Higiene" subtitle="Cómo venís con la plata" />
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
          <EmptyState
            title="Todavía no hay movimientos"
            action={
              <Link href="/" className="text-[13px] font-medium text-[#1c1f26] underline-offset-2 hover:underline">
                Volver al inicio
              </Link>
            }
          >
            Cuando cargues alguno, aparece el análisis.
          </EmptyState>
        </div>
      </div>
    );
  }

  const breakdown = getCategoryBreakdown(monthTx, salary);

  return (
    <div className="min-w-0">
      <PageHeader title="Higiene" subtitle="Saldo, ritmo y hábitos" />

      <div className="mx-auto grid w-full min-w-0 max-w-6xl grid-cols-1 items-stretch gap-4 px-4 py-4 sm:px-6 sm:py-6 xl:grid-cols-2">
        <TuDineroPanel className="xl:col-span-2" />

        <BalanceLineCard points={points} />
        <FlowAreaCard
          points={area}
          currentLabel={snapshot.payPeriod ? "Nivel de este período" : "Nivel de este mes"}
          delta={areaDelta}
        />
        <CategoryStripCard
          className="xl:col-span-2"
          income={snapshot.calendarMonth.income}
          expense={snapshot.calendarMonth.expense}
          incomeCount={incomeCount}
          expenseCount={expenseCount}
          segments={strip}
        />

        <div className="grid items-stretch gap-4 lg:grid-cols-2 xl:col-span-2">
          <Card title="Para mirar" className="h-full">
            <div className="space-y-2">
              {insights.slice(0, 4).map((insight, index) => {
                const config = INSIGHT[insight.type];
                const Icon = config.icon;
                return (
                  <div key={index} className={cn("flex items-start gap-3 rounded-2xl px-3 py-3", config.box)}>
                    <IconWell size="sm" className="mt-0.5 bg-white">
                      <Icon size={14} />
                    </IconWell>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1c1f26]">
                        <CategoryDot color={config.dot} />
                        {insight.title}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-[#6d7480]">{insight.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Se repiten" className="h-full" action={<span className="text-[12px] text-[#9aa1ab]">{recurring.length}</span>}>
            {recurring.length === 0 ? (
              <EmptyState title="No hay gastos repetidos todavía." className="py-8" />
            ) : (
              <ul className="space-y-2">
                {recurring.slice(0, 6).map((item) => (
                  <li key={item.description}>
                    <ListRow
                      className="rounded-2xl bg-[#f6f7f9] px-3 py-3"
                      icon={
                        <IconWell size="sm">
                          <RefreshCw size={13} />
                        </IconWell>
                      }
                      title={item.description}
                      meta={`${CATEGORY_LABELS[item.category]} · ${item.count} veces`}
                      amount={<Amount value={item.avgAmount} size="secondary" tone="expense" />}
                    />
                  </li>
                ))}
              </ul>
            )}
            {breakdown.length > 0 ? (
              <p className="mt-3 text-[12px] text-[#b0b6bf]">
                La categoría más pesada del mes es {breakdown[0].label}.
              </p>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
