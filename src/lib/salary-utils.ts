import {
  addDaysISO,
  clampMonthDay,
  dateParts,
  daysBetween,
  parseDateOnly,
  shiftMonth,
  todayISO,
  weekdayISO,
} from "./dates";
import type { SalaryConfig, SalaryPayment } from "./types";

export interface NextPayment {
  date: Date;
  dateISO: string;
  daysLeft: number;
  hoursLeft: number;
  isToday: boolean;
  isTomorrow: boolean;
  period: PayPeriod;
}

export interface PayPeriod {
  start: string;
  end: string;
  daysLeft: number;
  daysElapsed: number;
  periodDays: number;
  progress: number;
  isToday: boolean;
  isTomorrow: boolean;
  source: "payment" | "schedule";
}

export type SalaryRegistrationPlan =
  | { ok: true; periodKey: string; coveredPayday: string; nextPayday: string }
  | { ok: false; periodKey: string; reason: string };

type PaymentRef = Pick<SalaryPayment, "date" | "periodKey">;

/** Primer día de cobro configurado en o después de `from`. */
export function scheduledOnOrAfter(config: SalaryConfig, from: string): string {
  if (config.frequency === "weekly") {
    for (let offset = 0; offset < 7; offset += 1) {
      const candidate = addDaysISO(from, offset);
      if (weekdayISO(candidate) === config.payDay) return candidate;
    }
  }

  if (config.frequency === "biweekly") {
    const days = [config.payDay, config.payDay2 ?? 15];
    const parts = dateParts(from);
    if (!parts) return from;
    const candidates: string[] = [];
    for (let offset = 0; offset < 3; offset += 1) {
      const shifted = shiftMonth(parts.year, parts.month, offset);
      for (const day of days) candidates.push(clampMonthDay(shifted.year, shifted.month, day));
    }
    candidates.sort();
    return candidates.find((candidate) => candidate >= from) ?? candidates[candidates.length - 1];
  }

  const parts = dateParts(from);
  if (!parts) return from;
  const thisMonth = clampMonthDay(parts.year, parts.month, config.payDay);
  if (thisMonth >= from) return thisMonth;
  const next = shiftMonth(parts.year, parts.month, 1);
  return clampMonthDay(next.year, next.month, config.payDay);
}

export function nextScheduledAfter(config: SalaryConfig, date: string): string {
  return scheduledOnOrAfter(config, addDaysISO(date, 1));
}

function previousScheduledBefore(config: SalaryConfig, date: string): string {
  if (config.frequency === "weekly") {
    for (let offset = 1; offset <= 7; offset += 1) {
      const candidate = addDaysISO(date, -offset);
      if (weekdayISO(candidate) === config.payDay) return candidate;
    }
  }

  if (config.frequency === "biweekly") {
    const days = [config.payDay, config.payDay2 ?? 15];
    const parts = dateParts(date);
    if (!parts) return date;
    const candidates: string[] = [];
    for (let offset = 0; offset < 3; offset += 1) {
      const shifted = shiftMonth(parts.year, parts.month, -offset);
      for (const day of days) candidates.push(clampMonthDay(shifted.year, shifted.month, day));
    }
    candidates.sort();
    const earlier = candidates.filter((candidate) => candidate < date);
    return earlier[earlier.length - 1] ?? candidates[0];
  }

  const parts = dateParts(date);
  if (!parts) return date;
  const thisMonth = clampMonthDay(parts.year, parts.month, config.payDay);
  if (thisMonth < date) return thisMonth;
  const previous = shiftMonth(parts.year, parts.month, -1);
  return clampMonthDay(previous.year, previous.month, config.payDay);
}

/** El cobro de `paymentDate` cierra el día configurado de ese ciclo. */
export function periodKeyForPayment(config: SalaryConfig, paymentDate: string): string {
  return scheduledOnOrAfter(config, paymentDate.slice(0, 10));
}

export function effectivePeriodKey(config: SalaryConfig, payment: PaymentRef): string {
  return payment.periodKey?.slice(0, 10) || periodKeyForPayment(config, payment.date);
}

export function planSalaryRegistration(
  config: SalaryConfig,
  payments: PaymentRef[],
  paymentDate: string
): SalaryRegistrationPlan {
  if (!dateParts(paymentDate)) {
    return { ok: false, periodKey: "", reason: "Esa fecha no es válida." };
  }
  const periodKey = periodKeyForPayment(config, paymentDate);
  const taken = payments.some((payment) => effectivePeriodKey(config, payment) === periodKey);
  if (taken) {
    return { ok: false, periodKey, reason: "Ya registraste un cobro para este período." };
  }
  return {
    ok: true,
    periodKey,
    coveredPayday: periodKey,
    nextPayday: nextScheduledAfter(config, periodKey),
  };
}

export function getCurrentPayPeriod(
  config: SalaryConfig,
  payments: PaymentRef[],
  today: string
): PayPeriod {
  const last = [...payments]
    .filter((payment) => payment.date.slice(0, 10) <= today)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  let start: string;
  let end: string;
  let source: PayPeriod["source"];

  if (last) {
    source = "payment";
    start = last.date.slice(0, 10);
    const covered = effectivePeriodKey(config, last);
    end = nextScheduledAfter(config, covered);
    while (end < today) end = nextScheduledAfter(config, end);
  } else {
    source = "schedule";
    end = scheduledOnOrAfter(config, today);
    start = previousScheduledBefore(config, end);
  }

  const daysLeft = Math.max(0, daysBetween(today, end));
  const periodDays = Math.max(1, daysBetween(start, end));
  const daysElapsed = Math.min(periodDays, Math.max(0, daysBetween(start, today)));
  const progress = Math.min(100, Math.max(0, (daysElapsed / periodDays) * 100));

  return {
    start,
    end,
    daysLeft,
    daysElapsed,
    periodDays,
    progress,
    isToday: end === today,
    isTomorrow: daysBetween(today, end) === 1,
    source,
  };
}

export function getNextPaymentDate(
  config: SalaryConfig,
  now: Date = new Date(),
  payments: PaymentRef[] = []
): NextPayment {
  const today = todayISO(now);
  const period = getCurrentPayPeriod(config, payments, today);
  return {
    date: parseDateOnly(period.end),
    dateISO: period.end,
    daysLeft: period.daysLeft,
    hoursLeft: 0,
    isToday: period.isToday,
    isTomorrow: period.isTomorrow,
    period,
  };
}

export function getPaymentProgress(
  config: SalaryConfig,
  now: Date = new Date(),
  payments: PaymentRef[] = []
): number {
  return getCurrentPayPeriod(config, payments, todayISO(now)).progress;
}
