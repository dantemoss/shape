import { addMonthsISO, clampMonthDay, dateParts, daysBetween, monthKey, shiftMonth } from "./dates";
import type { CardInstallment, CreditCard } from "./types";

/** Próximo día de mes, hoy incluido. El 31 en un mes corto cae en el último día. */
export function nextDayOfMonth(today: string, day: number): string | null {
  if (day < 1 || day > 31) return null;
  const parts = dateParts(today);
  if (!parts) return null;
  const thisMonth = clampMonthDay(parts.year, parts.month, day);
  if (thisMonth >= today) return thisMonth;
  const next = shiftMonth(parts.year, parts.month, 1);
  return clampMonthDay(next.year, next.month, day);
}

export function cyclePhrase(kind: "cierra" | "vence", days: number): string {
  const verb = kind === "cierra" ? "Cierra" : "Vence";
  if (days <= 0) return `${verb} hoy`;
  if (days === 1) return `${verb} mañana`;
  return `${verb} en ${days} días`;
}

export interface InstallmentSlice {
  id: string;
  description: string;
  monthly: number;
  remaining: number;
  nextDate: string;
  /** Entra en el resumen que está por cerrar. */
  inStatement: boolean;
}

export function installmentSlices(
  installments: CardInstallment[],
  today: string,
  closingISO: string | null
): InstallmentSlice[] {
  return installments.flatMap((installment) => {
    const remaining = installment.totalInstallments - installment.paidInstallments;
    if (remaining <= 0 || installment.totalInstallments <= 0) return [];
    const nextDate = addMonthsISO(installment.startDate, installment.paidInstallments);
    const inStatement = closingISO
      ? nextDate <= closingISO
      : (monthKey(nextDate) ?? "") <= (monthKey(today) ?? "");
    return [
      {
        id: installment.id,
        description: installment.description,
        monthly: installment.totalAmount / installment.totalInstallments,
        remaining,
        nextDate,
        inStatement,
      },
    ];
  });
}

export interface CardGlance {
  statement: number;
  /** El resumen sale de cuotas. Si no, es el saldo usado. */
  statementFromInstallments: boolean;
  closeISO: string | null;
  dueISO: string | null;
  closeLabel: string | null;
  dueLabel: string | null;
  thisMonth: number;
  later: number;
  available: number | null;
  usedPct: number | null;
}

export function cardGlance(card: CreditCard, installments: CardInstallment[], today: string): CardGlance {
  const closeISO = card.closingDay ? nextDayOfMonth(today, card.closingDay) : null;
  const dueISO = card.dueDay ? nextDayOfMonth(today, card.dueDay) : null;
  const slices = installmentSlices(
    installments.filter((installment) => installment.cardId === card.id),
    today,
    closeISO
  );
  const dueNow = slices.filter((slice) => slice.inStatement);
  const statementFromInstallments = dueNow.length > 0;
  const hasLimit = card.creditLimit > 0;
  return {
    statement: statementFromInstallments
      ? dueNow.reduce((sum, slice) => sum + slice.monthly, 0)
      : card.usedAmount,
    statementFromInstallments,
    closeISO,
    dueISO,
    closeLabel: closeISO ? cyclePhrase("cierra", daysBetween(today, closeISO)) : null,
    dueLabel: dueISO ? cyclePhrase("vence", daysBetween(today, dueISO)) : null,
    thisMonth: dueNow.length,
    later: slices.reduce((sum, slice) => sum + slice.remaining - (slice.inStatement ? 1 : 0), 0),
    available: hasLimit ? card.creditLimit - card.usedAmount : null,
    usedPct: hasLimit ? Math.min(100, Math.max(0, (card.usedAmount / card.creditLimit) * 100)) : null,
  };
}

export function cuotaLine(thisMonth: number, later: number): string {
  if (thisMonth === 0 && later === 0) return "Sin cuotas pendientes";
  const now = thisMonth === 1 ? "1 este mes" : `${thisMonth} este mes`;
  const after = later === 1 ? "1 después" : `${later} después`;
  if (thisMonth === 0) return after;
  if (later === 0) return now;
  return `${now} · ${after}`;
}
