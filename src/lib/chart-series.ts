import {
  addDaysISO,
  addMonthsISO,
  daysBetween,
  formatMonthShort,
  monthKey,
  weekdayISO,
} from "./dates";
import { getCategoryBreakdown } from "./health-utils";
import {
  computeAccountBalance,
  isArs,
  monthSeries,
  roundMoney,
  sumMovements,
  type AccountBaseline,
  type LedgerAdjustment,
  type LedgerMovement,
} from "./money";
import type { ExpenseCategory, Transaction } from "./types";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

const DONUT_COLORS = ["#F5A04C", "#3CB87A", "#F2C14E"] as const;
const STRIP_COLORS = ["#8B7CF6", "#6B93F5", "#F0A05A", "#3DCA86", "#67B7F0", "#F0734A"] as const;

export function monthTickLabel(key: string): string {
  const raw = formatMonthShort(key).replace(/\./g, "").trim();
  if (!raw) return key;
  return raw.charAt(0).toLocaleUpperCase("es-AR") + raw.slice(1);
}

export interface MonthFlowPoint {
  key: string;
  label: string;
  income: number;
  expense: number;
}

export function monthlyFlow(
  transactions: LedgerMovement[],
  today: string,
  months = 6
): MonthFlowPoint[] {
  return monthSeries(transactions, today, months).map((bucket) => ({
    key: bucket.key,
    label: monthTickLabel(bucket.key),
    income: bucket.income,
    expense: bucket.expense,
  }));
}

export interface AlignedDay {
  date: string;
  dayNumber: string;
  monthLabel: string;
  weekday: string;
  current: number;
  previous: number;
  future: boolean;
}

export function alignedSpendDays(
  transactions: LedgerMovement[],
  start: string,
  end: string,
  today: string
): AlignedDay[] {
  const length = Math.max(1, daysBetween(start, end));
  const previousStart = addDaysISO(start, -length);
  const days: AlignedDay[] = [];

  for (let index = 0; index < length; index += 1) {
    const date = addDaysISO(start, index);
    const previousDate = addDaysISO(previousStart, index);
    const future = date > today;
    days.push({
      date,
      dayNumber: String(Number(date.slice(8, 10))),
      monthLabel: monthTickLabel(date.slice(0, 7)).toLocaleLowerCase("es-AR"),
      weekday: WEEKDAYS[weekdayISO(date)] ?? "",
      current: future ? 0 : sumMovements(transactions, { from: date, to: date }).expense,
      previous: sumMovements(transactions, { from: previousDate, to: previousDate }).expense,
      future,
    });
  }

  return days;
}

export function averageElapsedSpend(days: AlignedDay[]): number {
  const elapsed = days.filter((day) => !day.future);
  if (elapsed.length === 0) return 0;
  const total = elapsed.reduce((sum, day) => sum + day.current, 0);
  return roundMoney(total / elapsed.length);
}

export function elapsedSpend(days: AlignedDay[]): number {
  return roundMoney(days.filter((day) => !day.future).reduce((sum, day) => sum + day.current, 0));
}

export interface BalancePoint {
  key: string;
  label: string;
  balance: number;
  income: number;
  changePct: number | null;
  hasBaseline: boolean;
}

function monthEnd(key: string, today: string): string {
  if (key === (monthKey(today) ?? today.slice(0, 7))) return today;
  return addDaysISO(addMonthsISO(`${key}-01`, 1), -1);
}

export function balanceSeries(
  baseline: AccountBaseline | null,
  transactions: LedgerMovement[],
  adjustments: LedgerAdjustment[],
  today: string,
  months = 8
): BalancePoint[] {
  const series = monthSeries(transactions, today, months);
  return series.map((bucket, index) => {
    const to = monthEnd(bucket.key, today);
    const account = computeAccountBalance(baseline, transactions, adjustments, to);
    const balance = account.hasBaseline ? account.balance : roundMoney(bucket.income - bucket.expense);
    const previous = index > 0 ? series[index - 1] : null;
    let changePct: number | null = null;
    if (previous) {
      const previousTo = monthEnd(previous.key, today);
      const previousAccount = computeAccountBalance(baseline, transactions, adjustments, previousTo);
      const previousBalance = previousAccount.hasBaseline
        ? previousAccount.balance
        : roundMoney(previous.income - previous.expense);
      if (previousBalance !== 0) changePct = ((balance - previousBalance) / Math.abs(previousBalance)) * 100;
    }
    return {
      key: bucket.key,
      label: monthTickLabel(bucket.key),
      balance,
      income: bucket.income,
      changePct,
      hasBaseline: account.hasBaseline,
    };
  });
}

export interface AreaPoint {
  date: string;
  label: string;
  current: number | null;
  previous: number;
}

export function periodArea(
  baseline: AccountBaseline | null,
  transactions: LedgerMovement[],
  adjustments: LedgerAdjustment[],
  start: string,
  end: string,
  today: string
): AreaPoint[] {
  const length = Math.max(1, daysBetween(start, end));
  const previousStart = addDaysISO(start, -length);
  const points: AreaPoint[] = [];

  for (let index = 0; index < length; index += 1) {
    const date = addDaysISO(start, index);
    const previousDate = addDaysISO(previousStart, index);
    const current = date <= today ? levelAt(baseline, transactions, adjustments, start, date) : null;
    const previous = levelAt(baseline, transactions, adjustments, previousStart, previousDate);
    points.push({
      date,
      label: `${Number(date.slice(8, 10))} ${monthTickLabel(date.slice(0, 7)).toLocaleLowerCase("es-AR")}`,
      current,
      previous,
    });
  }

  return points;
}

function levelAt(
  baseline: AccountBaseline | null,
  transactions: LedgerMovement[],
  adjustments: LedgerAdjustment[],
  windowStart: string,
  day: string
): number {
  if (baseline) return computeAccountBalance(baseline, transactions, adjustments, day).balance;
  const flows = sumMovements(transactions, { from: windowStart, to: day });
  return roundMoney(flows.income - flows.expense);
}

export interface MerchantRow {
  name: string;
  amount: number;
  previous: number;
  changePct: number | null;
}

export interface SparkPoint {
  label: string;
  value: number;
}

export interface MerchantCardModel {
  total: number;
  todayChangePct: number | null;
  rows: MerchantRow[];
  spark: SparkPoint[];
}

function merchantKey(value: string): string {
  return value.trim().toLocaleLowerCase("es-AR");
}

function isMerchantExpense(transaction: Transaction): boolean {
  return (
    transaction.type === "expense" &&
    transaction.countsInBalance !== false &&
    isArs(transaction.currency) &&
    Boolean(transaction.merchant?.trim())
  );
}

export function merchantCard(
  transactions: Transaction[],
  today: string,
  days = 30
): MerchantCardModel {
  const from = addDaysISO(today, -(days - 1));
  const previousTo = addDaysISO(from, -1);
  const previousFrom = addDaysISO(previousTo, -(days - 1));
  const rows = new Map<string, MerchantRow>();

  for (const transaction of transactions) {
    if (!isMerchantExpense(transaction)) continue;
    const day = transaction.date.slice(0, 10);
    const key = merchantKey(transaction.merchant ?? "");
    const current = rows.get(key) ?? {
      name: transaction.merchant!.trim(),
      amount: 0,
      previous: 0,
      changePct: null,
    };
    if (day >= from && day <= today) current.amount += transaction.amount;
    else if (day >= previousFrom && day <= previousTo) current.previous += transaction.amount;
    rows.set(key, current);
  }

  const ranked = [...rows.values()]
    .map((row) => ({
      ...row,
      amount: roundMoney(row.amount),
      previous: roundMoney(row.previous),
      changePct: row.previous > 0 ? ((row.amount - row.previous) / row.previous) * 100 : null,
    }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const spark: SparkPoint[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = addDaysISO(today, -offset);
    const value = transactions.reduce((sum, transaction) => {
      if (!isMerchantExpense(transaction)) return sum;
      if (transaction.date.slice(0, 10) !== date) return sum;
      return sum + transaction.amount;
    }, 0);
    spark.push({ label: (WEEKDAYS[weekdayISO(date)] ?? "").toUpperCase(), value: roundMoney(value) });
  }

  const todayTotal = spark[spark.length - 1]?.value ?? 0;
  const yesterdayTotal = spark[spark.length - 2]?.value ?? 0;
  const total = roundMoney(ranked.reduce((sum, row) => sum + row.amount, 0));

  return {
    total,
    todayChangePct: yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : null,
    rows: ranked,
    spark,
  };
}

export type SpendWindow = "week" | "month" | "year";

export interface DateWindow {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
}

export function spendWindowRange(window: SpendWindow, today: string): DateWindow {
  if (window === "week") {
    const from = addDaysISO(today, -6);
    return {
      from,
      to: today,
      previousFrom: addDaysISO(from, -7),
      previousTo: addDaysISO(today, -7),
    };
  }

  if (window === "year") {
    const year = Number(today.slice(0, 4));
    const from = `${year}-01-01`;
    const previousFrom = `${year - 1}-01-01`;
    const previousTo = `${year - 1}${today.slice(4)}`;
    return { from, to: today, previousFrom, previousTo };
  }

  const from = `${monthKey(today) ?? today.slice(0, 7)}-01`;
  const previousFrom = addMonthsISO(from, -1);
  const previousMonthLast = addDaysISO(from, -1);
  const sameDay = `${previousFrom.slice(0, 8)}${today.slice(8, 10)}`;
  const previousTo = sameDay > previousMonthLast ? previousMonthLast : sameDay;
  return { from, to: today, previousFrom, previousTo };
}

export function expenseTotal(transactions: Transaction[], from: string, to: string): number {
  return roundMoney(
    transactions.reduce((sum, transaction) => {
      if (transaction.type !== "expense" || transaction.countsInBalance === false || !isArs(transaction.currency)) {
        return sum;
      }
      const day = transaction.date.slice(0, 10);
      if (day < from || day > to) return sum;
      return sum + transaction.amount;
    }, 0)
  );
}

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
  hatch: boolean;
}

export function expenseDonut(
  transactions: Transaction[],
  from: string,
  to: string
): { total: number; slices: DonutSlice[] } {
  const scoped = transactions.filter((transaction) => {
    const day = transaction.date.slice(0, 10);
    return day >= from && day <= to;
  });
  const breakdown = getCategoryBreakdown(scoped, 0);
  const top = breakdown.slice(0, 3);
  const rest = roundMoney(breakdown.slice(3).reduce((sum, item) => sum + item.amount, 0));
  const slices: DonutSlice[] = top.map((item, index) => ({
    label: item.label,
    value: roundMoney(item.amount),
    color: DONUT_COLORS[index] ?? DONUT_COLORS[0],
    hatch: false,
  }));
  if (rest > 0) slices.push({ label: "Resto", value: rest, color: "#F3EEE4", hatch: true });
  const total = roundMoney(slices.reduce((sum, slice) => sum + slice.value, 0));
  return { total, slices };
}

export interface StripSegment {
  key: string;
  label: string;
  amount: number;
  pct: number;
  color: string;
}

export function categoryStrip(transactions: Transaction[], from: string, to: string): StripSegment[] {
  const scoped = transactions.filter((transaction) => {
    const day = transaction.date.slice(0, 10);
    return day >= from && day <= to;
  });
  const breakdown = getCategoryBreakdown(scoped, 0);
  if (breakdown.length === 0) return [];

  const major = breakdown.filter((item) => item.percentage >= 8).slice(0, 4);
  const chosen = major.length > 0 ? major : breakdown.slice(0, 4);
  const used = new Set<ExpenseCategory>(chosen.map((item) => item.category));
  const restAmount = roundMoney(
    breakdown.filter((item) => !used.has(item.category)).reduce((sum, item) => sum + item.amount, 0)
  );
  const total = breakdown.reduce((sum, item) => sum + item.amount, 0) || 1;

  const segments: StripSegment[] = chosen.map((item, index) => ({
    key: item.category,
    label: item.label,
    amount: roundMoney(item.amount),
    pct: Math.round(item.percentage),
    color: STRIP_COLORS[index % STRIP_COLORS.length],
  }));

  if (restAmount > 0) {
    segments.push({
      key: "rest",
      label: "Resto",
      amount: restAmount,
      pct: Math.round((restAmount / total) * 100),
      color: STRIP_COLORS[segments.length % STRIP_COLORS.length],
    });
  }

  const pctSum = segments.reduce((sum, segment) => sum + segment.pct, 0);
  if (segments.length > 0 && pctSum !== 100) {
    segments[segments.length - 1].pct += 100 - pctSum;
  }
  return segments.filter((segment) => segment.pct > 0);
}

export function allowance(expected: number, spent: number, daysLeft: number) {
  const left = roundMoney(expected - spent);
  const perDay = daysLeft > 0 ? roundMoney(Math.max(left, 0) / daysLeft) : 0;
  return {
    expected: roundMoney(expected),
    spent: roundMoney(spent),
    left,
    perDay,
    pct: expected > 0 ? (spent / expected) * 100 : 0,
  };
}

export function lastWeek(days: AlignedDay[], today: string): AlignedDay[] {
  const elapsed = days.filter((day) => day.date <= today);
  return elapsed.slice(-7);
}
