import { SalaryConfig } from "./types";

export interface NextPayment {
  date: Date;
  daysLeft: number;
  hoursLeft: number;
  isToday: boolean;
  isTomorrow: boolean;
}

export function getNextPaymentDate(config: SalaryConfig): NextPayment {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let nextDate: Date;

  if (config.frequency === "monthly") {
    nextDate = getNextMonthlyDate(today, config.payDay);
  } else if (config.frequency === "biweekly") {
    nextDate = getNextBiweeklyDate(today, config.payDay, config.payDay2 ?? 15);
  } else {
    nextDate = getNextWeeklyDate(today, config.payDay);
  }

  const msLeft = nextDate.getTime() - now.getTime();
  const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return {
    date: nextDate,
    daysLeft: Math.max(0, daysLeft),
    hoursLeft: Math.max(0, hoursLeft),
    isToday: daysLeft === 0,
    isTomorrow: daysLeft === 1,
  };
}

function getNextMonthlyDate(today: Date, payDay: number): Date {
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), payDay);
  if (thisMonth >= today) return thisMonth;
  return new Date(today.getFullYear(), today.getMonth() + 1, payDay);
}

function getNextBiweeklyDate(today: Date, day1: number, day2: number): Date {
  const candidates = [
    new Date(today.getFullYear(), today.getMonth(), day1),
    new Date(today.getFullYear(), today.getMonth(), day2),
    new Date(today.getFullYear(), today.getMonth() + 1, day1),
    new Date(today.getFullYear(), today.getMonth() + 1, day2),
  ];
  const future = candidates.filter((d) => d >= today);
  return future.sort((a, b) => a.getTime() - b.getTime())[0];
}

function getNextWeeklyDate(today: Date, dayOfWeek: number): Date {
  const current = today.getDay();
  let diff = dayOfWeek - current;
  if (diff <= 0) diff += 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next;
}

export function getPaymentProgress(config: SalaryConfig): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let periodDays: number;
  if (config.frequency === "monthly") periodDays = 30;
  else if (config.frequency === "biweekly") periodDays = 15;
  else periodDays = 7;

  const next = getNextPaymentDate(config);
  const daysElapsed = periodDays - next.daysLeft;
  return Math.min(Math.max((daysElapsed / periodDays) * 100, 0), 100);
}
