import type { SalaryConfig, SalaryPayment, Transaction } from "./types";
import { effectivePeriodKey } from "./salary-utils";

export interface SalaryLinkCandidate {
  paymentId: string;
  incomeId: string;
}

export interface DuplicatePeriodGroup {
  periodKey: string;
  paymentIds: string[];
}

export interface UnlinkedSalaryPayment {
  paymentId: string;
  candidateIncomeIds: string[];
}

export interface ExtraSalaryIncome {
  incomeId: string;
  paymentId: string;
}

export interface OrphanSalaryIncome {
  incomeId: string;
}

export interface SalaryReview {
  duplicatePeriods: DuplicatePeriodGroup[];
  unlinked: UnlinkedSalaryPayment[];
  extras: ExtraSalaryIncome[];
  orphans: OrphanSalaryIncome[];
}

type PaymentLike = Pick<SalaryPayment, "id" | "amount" | "date" | "note" | "incomeId" | "periodKey">;
type IncomeLike = Pick<
  Transaction,
  "id" | "type" | "amount" | "date" | "description" | "salaryPaymentId" | "countsInBalance" | "kind"
>;

function sameMoney(a: number, b: number): boolean {
  return Math.round(a * 100) === Math.round(b * 100);
}

function fold(value: string | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase("es-AR");
}

function dayNumber(iso: string): number | null {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function withinDays(a: string, b: string, days: number): boolean {
  const left = dayNumber(a);
  const right = dayNumber(b);
  if (left == null || right == null) return false;
  return Math.abs(left - right) <= days;
}

function looksLikeSalary(description: string, salaryLabel: string): boolean {
  const text = fold(description);
  if (!text) return false;
  if (text.includes("sueldo")) return true;
  const label = fold(salaryLabel);
  return Boolean(label) && text === label;
}

/** Misma regla que la migración: fecha, monto y una descripción que identifica al sueldo.
 *  maxDayGap deja pasar el día corrido del bug de UTC (el cobro del 23 quedó como 22). */
export function incomeMatchesSalaryPayment(
  income: Pick<IncomeLike, "type" | "amount" | "date" | "description">,
  payment: Pick<PaymentLike, "amount" | "date" | "note">,
  salaryLabel: string,
  maxDayGap = 0
): boolean {
  if (income.type !== "income") return false;
  if (!withinDays(income.date, payment.date, maxDayGap)) return false;
  if (!sameMoney(income.amount, payment.amount)) return false;
  const description = fold(income.description);
  if (!description) return false;
  const label = fold(salaryLabel);
  const note = fold(payment.note);
  if (label && description === label) return true;
  if (note && description === note) return true;
  return description.includes("sueldo");
}

/**
 * Vincula solo pares 1 a 1. Si hay dos ingresos para un cobro, no elige solo:
 * quedan para la revisión en pantalla.
 */
export function unambiguousSalaryLinks(
  payments: PaymentLike[],
  incomes: IncomeLike[],
  salaryLabel: string
): SalaryLinkCandidate[] {
  const openPayments = payments.filter((payment) => !payment.incomeId);
  const openIncomes = incomes.filter((income) => income.type === "income" && !income.salaryPaymentId);

  const pairs: { paymentId: string; incomeId: string }[] = [];
  for (const payment of openPayments) {
    for (const income of openIncomes) {
      if (incomeMatchesSalaryPayment(income, payment, salaryLabel)) {
        pairs.push({ paymentId: payment.id, incomeId: income.id });
      }
    }
  }

  return pairs.filter((pair) => {
    const incomesForPayment = pairs.filter((item) => item.paymentId === pair.paymentId).length;
    const paymentsForIncome = pairs.filter((item) => item.incomeId === pair.incomeId).length;
    return incomesForPayment === 1 && paymentsForIncome === 1;
  });
}

export function reviewSalaryRecords(
  payments: PaymentLike[],
  incomes: IncomeLike[],
  salaryLabel: string,
  config: SalaryConfig | null
): SalaryReview {
  const groups = new Map<string, string[]>();
  if (config) {
    for (const payment of payments) {
      const key = effectivePeriodKey(config, payment);
      const current = groups.get(key) ?? [];
      current.push(payment.id);
      groups.set(key, current);
    }
  }

  const duplicatePeriods = [...groups.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([periodKey, paymentIds]) => ({ periodKey, paymentIds }));

  const unlinked = payments
    .filter((payment) => !payment.incomeId)
    .map((payment) => ({
      paymentId: payment.id,
      candidateIncomeIds: incomes
        .filter(
          (income) =>
            income.type === "income" &&
            !income.salaryPaymentId &&
            income.countsInBalance !== false &&
            income.date.slice(0, 10) === payment.date.slice(0, 10) &&
            sameMoney(income.amount, payment.amount)
        )
        .map((income) => income.id),
    }));

  const extras: ExtraSalaryIncome[] = [];
  for (const payment of payments) {
    if (!payment.incomeId) continue;
    for (const income of incomes) {
      if (income.id === payment.incomeId) continue;
      if (income.salaryPaymentId) continue;
      if (income.countsInBalance === false) continue;
      if (!incomeMatchesSalaryPayment(income, payment, salaryLabel, 1)) continue;
      extras.push({ incomeId: income.id, paymentId: payment.id });
    }
  }

  const extraIds = new Set(extras.map((extra) => extra.incomeId));
  const orphans: OrphanSalaryIncome[] = [];
  if (config) {
    for (const income of incomes) {
      if (income.type !== "income" || income.salaryPaymentId) continue;
      if (income.countsInBalance === false) continue;
      if (extraIds.has(income.id)) continue;
      if (!sameMoney(income.amount, config.amount)) continue;
      if (!looksLikeSalary(income.description, salaryLabel)) continue;
      orphans.push({ incomeId: income.id });
    }
  }

  return { duplicatePeriods, unlinked, extras, orphans };
}
