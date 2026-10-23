import {
  addDaysISO,
  addMonthsISO,
  calendarWindowStart,
  monthKey,
  parseDateOnly,
  todayISO,
  type CalendarWindow,
} from "./dates";
import type { SalaryConfig, SalaryPayment, Transaction } from "./types";
import { getCurrentPayPeriod } from "./salary-utils";

export interface LedgerMovement {
  type: "income" | "expense";
  amount: number;
  date: string;
  currency?: string | null;
  countsInBalance?: boolean;
  kind?: "regular" | "salary" | string | null;
  salaryPaymentId?: string | null;
  id?: string;
}

export interface LedgerAdjustment {
  amount: number;
  date: string;
}

export interface AccountBaseline {
  startingBalance: number;
  startingDate: string;
}

export interface FlowTotals {
  income: number;
  expense: number;
}

export interface AccountBalance extends FlowTotals {
  hasBaseline: boolean;
  balance: number;
  adjustments: number;
}

export interface PayPeriodSnapshot {
  start: string;
  end: string;
  daysLeft: number;
  daysElapsed: number;
  periodDays: number;
  progress: number;
  isToday: boolean;
  isTomorrow: boolean;
  source: "payment" | "schedule";
  expense: number;
  income: number;
  salaryReceived: number;
  salaryExpected: number;
  spendPct: number;
}

export interface MoneySnapshot {
  today: string;
  account: AccountBalance;
  calendarMonth: FlowTotals & { key: string };
  allTimeArs: FlowTotals;
  usd: FlowTotals;
  payPeriod: PayPeriodSnapshot | null;
}

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatPesos(amount: number): string {
  const rounded = roundMoney(amount);
  const abs = Math.abs(rounded);
  const digits = Math.abs(abs - Math.round(abs)) < 0.001 ? 0 : 2;
  const formatted = abs.toLocaleString("es-AR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: 2,
  });
  return rounded < 0 ? `−$${formatted}` : `$${formatted}`;
}

export function formatMoney(amount: number, currency?: string | null): string {
  const code = normalizeCurrency(currency);
  if (code === "ARS") return formatPesos(amount);
  const rounded = roundMoney(amount);
  const abs = Math.abs(rounded);
  const formatted = abs.toLocaleString("es-AR", { maximumFractionDigits: 2 });
  const sign = rounded < 0 ? "−" : "";
  if (code === "USD") return `${sign}US$${formatted}`;
  return `${sign}${formatted} ${code}`;
}

export function normalizeCurrency(value: string | null | undefined): string {
  const code = (value ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : "ARS";
}

export function isArs(value: string | null | undefined): boolean {
  return normalizeCurrency(value) === "ARS";
}

export function countsInLedger(movement: LedgerMovement): boolean {
  return movement.countsInBalance !== false && Number.isFinite(movement.amount);
}

export function adjustmentForTarget(current: number, target: number): number | null {
  const delta = roundMoney(target - current);
  return delta === 0 ? null : delta;
}

function inRange(date: string, from?: string, to?: string, untilExclusive?: string): boolean {
  const day = date.slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  if (untilExclusive && day >= untilExclusive) return false;
  return true;
}

export function sumMovements(
  movements: LedgerMovement[],
  range: { from?: string; to?: string; untilExclusive?: string } = {}
): FlowTotals & { usd: FlowTotals } {
  let income = 0;
  let expense = 0;
  let usdIncome = 0;
  let usdExpense = 0;

  for (const movement of movements) {
    if (!countsInLedger(movement)) continue;
    if (!inRange(movement.date, range.from, range.to, range.untilExclusive)) continue;
    const bucket = movement.type === "income" ? "income" : "expense";
    if (isArs(movement.currency)) {
      if (bucket === "income") income += movement.amount;
      else expense += movement.amount;
    } else if (normalizeCurrency(movement.currency) === "USD") {
      if (bucket === "income") usdIncome += movement.amount;
      else usdExpense += movement.amount;
    }
  }

  return {
    income: roundMoney(income),
    expense: roundMoney(expense),
    usd: { income: roundMoney(usdIncome), expense: roundMoney(usdExpense) },
  };
}

export function computeAccountBalance(
  baseline: AccountBaseline | null,
  movements: LedgerMovement[],
  adjustments: LedgerAdjustment[],
  asOf: string
): AccountBalance {
  if (!baseline) {
    return { hasBaseline: false, balance: 0, income: 0, expense: 0, adjustments: 0 };
  }

  const flows = sumMovements(movements, { from: baseline.startingDate, to: asOf });
  let adjustmentTotal = 0;
  for (const adjustment of adjustments) {
    if (!Number.isFinite(adjustment.amount)) continue;
    if (!inRange(adjustment.date, baseline.startingDate, asOf)) continue;
    adjustmentTotal += adjustment.amount;
  }
  adjustmentTotal = roundMoney(adjustmentTotal);

  return {
    hasBaseline: true,
    balance: roundMoney(baseline.startingBalance + flows.income - flows.expense + adjustmentTotal),
    income: flows.income,
    expense: flows.expense,
    adjustments: adjustmentTotal,
  };
}

function salaryReceivedInPeriod(
  movements: LedgerMovement[],
  payments: Pick<SalaryPayment, "date" | "incomeId">[],
  start: string,
  end: string
): number {
  const linkedIds = new Set(
    payments
      .filter((payment) => payment.incomeId && inRange(payment.date, start, undefined, end))
      .map((payment) => payment.incomeId as string)
  );

  let total = 0;
  for (const movement of movements) {
    if (movement.type !== "income" || !countsInLedger(movement) || !isArs(movement.currency)) continue;
    if (!inRange(movement.date, start, undefined, end)) continue;
    const isSalary =
      movement.kind === "salary" ||
      Boolean(movement.salaryPaymentId) ||
      (movement.id != null && linkedIds.has(movement.id));
    if (!isSalary) continue;
    total += movement.amount;
  }
  return roundMoney(total);
}

export function buildMoneySnapshot(input: {
  account: AccountBaseline | null;
  transactions: LedgerMovement[];
  adjustments: LedgerAdjustment[];
  salaryConfig: SalaryConfig | null;
  salaryPayments: Pick<SalaryPayment, "id" | "date" | "amount" | "periodKey" | "incomeId">[];
  today?: string;
}): MoneySnapshot {
  const today = input.today ?? todayISO();
  const month = monthKey(today) ?? today.slice(0, 7);
  const monthTotals = sumMovements(input.transactions, { from: `${month}-01`, to: today });
  const allTime = sumMovements(input.transactions);
  const account = computeAccountBalance(input.account, input.transactions, input.adjustments, today);

  let payPeriod: PayPeriodSnapshot | null = null;
  if (input.salaryConfig) {
    const period = getCurrentPayPeriod(input.salaryConfig, input.salaryPayments, today);
    const flows = sumMovements(input.transactions, { from: period.start, untilExclusive: period.end, to: today });
    const salaryReceived = salaryReceivedInPeriod(input.transactions, input.salaryPayments, period.start, period.end);
    const salaryExpected = input.salaryConfig.amount;
    payPeriod = {
      start: period.start,
      end: period.end,
      daysLeft: period.daysLeft,
      daysElapsed: period.daysElapsed,
      periodDays: period.periodDays,
      progress: period.progress,
      isToday: period.isToday,
      isTomorrow: period.isTomorrow,
      source: period.source,
      expense: flows.expense,
      income: flows.income,
      salaryReceived,
      salaryExpected,
      spendPct: salaryExpected > 0 ? (flows.expense / salaryExpected) * 100 : 0,
    };
  }

  return {
    today,
    account,
    calendarMonth: { key: month, income: monthTotals.income, expense: monthTotals.expense },
    allTimeArs: { income: allTime.income, expense: allTime.expense },
    usd: allTime.usd,
    payPeriod,
  };
}

export function monthSeries(transactions: LedgerMovement[], today: string, months: number) {
  return Array.from({ length: months }, (_, index) => {
    const cursor = addMonthsISO(today, index - (months - 1));
    const key = monthKey(cursor) ?? cursor.slice(0, 7);
    const from = `${key}-01`;
    const nextMonth = addMonthsISO(from, 1);
    const lastDay = addDaysISO(nextMonth, -1);
    const to = key === monthKey(today) ? today : lastDay;
    const totals = sumMovements(transactions, { from, to });
    return {
      key,
      date: parseDateOnly(from),
      income: totals.income,
      expense: totals.expense,
    };
  });
}

export function sumCalendarWindow(
  transactions: LedgerMovement[],
  window: CalendarWindow,
  today: string
): FlowTotals & { from: string; usd: FlowTotals } {
  const from = calendarWindowStart(window, today);
  const totals = sumMovements(transactions, { from, to: today });
  return { from, income: totals.income, expense: totals.expense, usd: totals.usd };
}

export function isArsTransaction(transaction: Pick<Transaction, "currency" | "countsInBalance">): boolean {
  return transaction.countsInBalance !== false && isArs(transaction.currency);
}
