"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { TransactionForm } from "@/components/transaction-form";
import { RealBalancePanel } from "@/components/real-balance-panel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DayCylindersCard, type CylinderMovement } from "@/components/viz/day-cylinders";
import { DailyBarsCard } from "@/components/viz/daily-bars";
import { BudgetBlocksCard } from "@/components/viz/budget-blocks";
import { BudgetGaugeCard } from "@/components/viz/budget-gauge";
import { ExpenseDonutCard } from "@/components/viz/expense-donut";
import { MerchantCard } from "@/components/viz/merchant-card";
import { MonthlyBarsCard } from "@/components/viz/monthly-bars";
import { argentinaHour } from "@/lib/dates";
import { formatIso } from "@/lib/format-date";
import {
  alignedSpendDays,
  allowance,
  expenseDonut,
  expenseTotal,
  merchantCard,
  monthlyFlow,
  spendWindowRange,
  type SpendWindow,
} from "@/lib/chart-series";
import { useShapeStore } from "@/lib/store";
import { CATEGORY_LABELS } from "@/lib/types";
import { useMoneySnapshot } from "@/lib/use-money";
import { Amount, Card, EmptyState, IconWell, ListRow, PageHeader } from "@/components/primitives";

function sentenceCase(value: string): string {
  return value.charAt(0).toLocaleUpperCase("es-AR") + value.slice(1);
}

function greeting(name: string): string {
  const hour = argentinaHour();
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  return `${saludo}, ${name}`;
}

function whenLabel(value: string): string {
  const day = formatIso(value, "d 'de' MMMM");
  if (!value.includes("T")) return day;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return day;
  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(parsed);
  return `${day} · ${time}`;
}

export default function DashboardPage() {
  const [window, setWindow] = useState<SpendWindow>("month");
  const [newTxOpen, setNewTxOpen] = useState(false);
  const allTx = useShapeStore((s) => s.transactions);
  const userProfile = useShapeStore((s) => s.userProfile);
  const snapshot = useMoneySnapshot();
  const period = snapshot.payPeriod;

  const months = useMemo(() => monthlyFlow(allTx, snapshot.today, 6), [allTx, snapshot.today]);
  const range = useMemo(() => spendWindowRange(window, snapshot.today), [window, snapshot.today]);
  const donut = useMemo(() => expenseDonut(allTx, range.from, range.to), [allTx, range.from, range.to]);
  const previousTotal = useMemo(
    () => expenseTotal(allTx, range.previousFrom, range.previousTo),
    [allTx, range.previousFrom, range.previousTo]
  );
  const days = useMemo(
    () => (period ? alignedSpendDays(allTx, period.start, period.end, snapshot.today) : []),
    [allTx, period, snapshot.today]
  );
  const merchants = useMemo(() => merchantCard(allTx, snapshot.today, 30), [allTx, snapshot.today]);
  const movements = useMemo<CylinderMovement[]>(
    () =>
      [...allTx]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((transaction) => ({
          id: transaction.id,
          date: transaction.date.slice(0, 10),
          title: transaction.merchant?.trim() || transaction.description,
          meta: `${CATEGORY_LABELS[transaction.category]} · ${whenLabel(transaction.date)}`,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
        })),
    [allTx]
  );
  const budget = period ? allowance(period.salaryExpected, period.expense, period.daysLeft) : null;
  const periodLabel = period
    ? `${formatIso(period.start, "d MMM")} – ${formatIso(period.end, "d MMM")}`
    : null;
  const recent = useMemo(
    () => [...allTx].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [allTx]
  );

  return (
    <div className="min-w-0">
      <PageHeader
        title={userProfile ? greeting(userProfile.name) : "Inicio"}
        subtitle={sentenceCase(formatIso(snapshot.today, "EEEE d 'de' MMMM"))}
        action={
        <Dialog open={newTxOpen} onOpenChange={setNewTxOpen}>
          <DialogTrigger render={<Button className="gap-2 rounded-full" />}>
            <Plus size={15} />
            <span className="hidden min-[380px]:inline">Nuevo movimiento</span>
            <span className="min-[380px]:hidden">Nuevo</span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo movimiento</DialogTitle>
            </DialogHeader>
            <TransactionForm onSuccess={() => setNewTxOpen(false)} />
          </DialogContent>
        </Dialog>
        }
      />

      <div className="mx-auto grid w-full min-w-0 max-w-6xl grid-cols-1 items-stretch gap-4 px-4 py-4 sm:px-6 sm:py-6 xl:grid-cols-2">
        <div className="xl:col-span-2">
          <RealBalancePanel />
        </div>

        <MonthlyBarsCard points={months} />
        <DailyBarsCard days={days} periodLabel={periodLabel} />

        <ExpenseDonutCard
          total={donut.total}
          previous={previousTotal}
          slices={donut.slices}
          window={window}
          onWindow={setWindow}
        />
        <BudgetGaugeCard
          spent={budget?.spent ?? 0}
          expected={budget?.expected ?? 0}
          left={budget?.left ?? 0}
          pct={budget?.pct ?? 0}
          periodLabel={periodLabel}
        />

        <div className="xl:col-span-2">
          {budget ? (
            <BudgetBlocksCard
              spent={budget.spent}
              expected={budget.expected}
              left={budget.left}
              daysLeft={period?.daysLeft ?? 0}
              perDay={budget.perDay}
            />
          ) : (
            <BudgetBlocksCard spent={0} expected={0} left={0} daysLeft={0} perDay={0} />
          )}
        </div>

        <DayCylindersCard days={days} movements={movements} periodLabel={periodLabel} />
        <MerchantCard model={merchants} />

        <Card
          className="xl:col-span-2"
          title="Últimos movimientos"
          action={
            <Link href="/transactions" className="text-[13px] font-medium text-[#6d7480]">
              Ver todo
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState title="Todavía no hay movimientos." />
          ) : (
            <ul className="divide-y divide-black/[0.04]">
              {recent.map((transaction) => (
                <li key={transaction.id}>
                  <ListRow
                    className="py-3"
                    icon={
                      <IconWell>
                        {transaction.type === "income" ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                      </IconWell>
                    }
                    title={transaction.description}
                    meta={`${CATEGORY_LABELS[transaction.category]} · ${formatIso(transaction.date, "d MMM")}`}
                    amount={
                      <Amount
                        value={Math.abs(transaction.amount)}
                        size="secondary"
                        currency={transaction.currency}
                        tone={transaction.type === "income" ? "income" : "neutral"}
                        signed
                      />
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
