import {
  addDaysISO,
  dateParts,
  daysBetween,
  daysInMonth,
  monthKey,
  toISO,
  weekdayISO,
  APP_TIME_ZONE,
} from "@/lib/dates";
import { formatIso } from "@/lib/format-date";
import { formatMoney, formatPesos, isArs, normalizeCurrency, roundMoney } from "@/lib/money";
import { CATEGORY_LABELS, RECURRENCE_LABELS, type ExpenseCategory, type Transaction } from "@/lib/types";

export type TypeFilter = "all" | "expense" | "income";
export type CurrencyFilter = "all" | "ARS" | "USD";
export type RangePreset = "period" | "month" | "custom";
export type CategoryFilter = "all" | ExpenseCategory;

export interface DateRange {
  /** Inclusive, YYYY-MM-DD civil de Argentina. */
  from: string;
  /** Inclusive, YYYY-MM-DD civil de Argentina. */
  to: string;
}

export interface MovementFilters {
  query: string;
  type: TypeFilter;
  category: CategoryFilter;
  currency: CurrencyFilter;
  range: DateRange;
}

export interface DayGroup {
  day: string;
  label: string;
  transactions: Transaction[];
  arsNet: number;
  usdNet: number;
  hasArs: boolean;
  hasUsd: boolean;
}

export interface FilterSummary {
  count: number;
  /** Magnitud del lado que se muestra. Nunca es un neto. */
  total: number;
  side: "expense" | "income";
  currency: "ARS" | "USD";
  average: number;
  days: number;
  usdAside: boolean;
}

export interface WeekdayBucket {
  key: string;
  label: string;
  value: number;
}

export interface WeekdayPattern {
  title: string;
  currency: "ARS" | "USD";
  buckets: WeekdayBucket[];
  peakLabel: string | null;
}

const WEEKDAYS = [
  { key: "mon", label: "Lun" },
  { key: "tue", label: "Mar" },
  { key: "wed", label: "Mié" },
  { key: "thu", label: "Jue" },
  { key: "fri", label: "Vie" },
  { key: "sat", label: "Sáb" },
  { key: "sun", label: "Dom" },
] as const;

const WEEKDAY_LONG = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

/** El día civil guardado. Los primeros 10 caracteres, nunca un parseo UTC. */
export function civilDay(value: string): string {
  return value.slice(0, 10);
}

export function monthRange(today: string): DateRange {
  const key = monthKey(today) ?? today.slice(0, 7);
  const [yearText, monthText] = key.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!year || !month) return { from: today, to: today };
  return { from: `${key}-01`, to: toISO(year, month, daysInMonth(year, month)) };
}

/**
 * El período de cobro guarda `end` exclusivo (el próximo día de cobro).
 * Acá el rango es inclusivo en ambos extremos.
 */
export function periodRange(period: { start: string; end: string } | null, today: string): DateRange {
  if (!period) return monthRange(today);
  const from = civilDay(period.start);
  const last = addDaysISO(civilDay(period.end), -1);
  if (!dateParts(from)) return monthRange(today);
  return { from, to: last < from ? from : last };
}

export function clampRange(from: string, to: string, fallback: string): DateRange {
  const start = dateParts(from) ? civilDay(from) : fallback;
  const end = dateParts(to) ? civilDay(to) : fallback;
  return start <= end ? { from: start, to: end } : { from: end, to: start };
}

export function inDateRange(value: string, range: DateRange): boolean {
  const day = civilDay(value);
  return day >= range.from && day <= range.to;
}

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-AR")
    .trim();
}

export function matchesQuery(transaction: Transaction, query: string): boolean {
  const needle = normalizeSearch(query);
  if (!needle) return true;
  const haystack = normalizeSearch(`${transaction.merchant ?? ""} ${transaction.description}`);
  return haystack.includes(needle);
}

export function matchesFilters(transaction: Transaction, filters: MovementFilters): boolean {
  if (!inDateRange(transaction.date, filters.range)) return false;
  if (filters.type !== "all" && transaction.type !== filters.type) return false;
  if (filters.category !== "all" && transaction.category !== filters.category) return false;
  if (filters.currency !== "all" && normalizeCurrency(transaction.currency) !== filters.currency) return false;
  return matchesQuery(transaction, filters.query);
}

export function dayLabel(day: string, today: string): string {
  const civil = civilDay(day);
  if (civil === today) return "Hoy";
  if (civil === addDaysISO(today, -1)) return "Ayer";
  const label = formatIso(civil, "EEEE d MMM").replace(/\./g, "");
  return label.charAt(0).toLocaleUpperCase("es-AR") + label.slice(1);
}

export function shortRangeLabel(range: DateRange): string {
  const from = formatIso(range.from, "d MMM").replace(/\./g, "");
  const to = formatIso(range.to, "d MMM").replace(/\./g, "");
  if (range.from === range.to) return from;
  return `${from} – ${to}`;
}

/** Reloj de Argentina, solo si el instante cae en el mismo día civil del movimiento. */
export function movementClock(transaction: Transaction): string | null {
  const source = transaction.date.includes("T")
    ? transaction.date
    : transaction.createdAt?.includes("T")
      ? transaction.createdAt
      : null;
  if (!source) return null;
  const instant = new Date(source);
  if (Number.isNaN(instant.getTime())) return null;
  const argentinaDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
  if (argentinaDay !== civilDay(transaction.date)) return null;
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: APP_TIME_ZONE,
  }).format(instant);
}

function sortKey(transaction: Transaction): string {
  const clock = movementClock(transaction);
  if (transaction.date.includes("T") && clock) return transaction.date;
  if (transaction.createdAt?.includes("T") && clock) return transaction.createdAt;
  return transaction.createdAt || transaction.date;
}

export function movementTitle(transaction: Transaction): string {
  const merchant = transaction.merchant?.trim();
  if (merchant) return merchant;
  const description = transaction.description.trim();
  if (description) return description;
  return transaction.type === "income" ? "Ingreso" : "Gasto";
}

export function movementDetail(transaction: Transaction): string {
  const parts: string[] = [CATEGORY_LABELS[transaction.category]];
  const merchant = transaction.merchant?.trim() ?? "";
  const description = transaction.description.trim();
  if (description && description !== merchant && description !== CATEGORY_LABELS[transaction.category]) {
    parts.push(description);
  }
  if (transaction.kind === "salary") parts.push("Sueldo");
  if (transaction.countsInBalance === false) parts.push("No suma");
  if (normalizeCurrency(transaction.currency) === "USD") parts.push("USD");
  if (transaction.recurrence !== "once") parts.push(RECURRENCE_LABELS[transaction.recurrence]);
  if (transaction.hasInstallments && transaction.currentInstallment && transaction.totalInstallments) {
    parts.push(`Cuota ${transaction.currentInstallment}/${transaction.totalInstallments}`);
  }
  return parts.join(" · ");
}

function signedAmount(transaction: Transaction): number {
  return transaction.type === "expense" ? -transaction.amount : transaction.amount;
}

export function groupByDay(transactions: Transaction[], today: string): DayGroup[] {
  const buckets = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    const day = civilDay(transaction.date);
    const list = buckets.get(day);
    if (list) list.push(transaction);
    else buckets.set(day, [transaction]);
  }

  return [...buckets.keys()]
    .sort((a, b) => b.localeCompare(a))
    .map((day) => {
      const items = [...(buckets.get(day) ?? [])].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
      let arsNet = 0;
      let usdNet = 0;
      let hasArs = false;
      let hasUsd = false;
      for (const transaction of items) {
        if (transaction.countsInBalance === false || !Number.isFinite(transaction.amount)) continue;
        const signed = signedAmount(transaction);
        if (isArs(transaction.currency)) {
          hasArs = true;
          arsNet += signed;
        } else if (normalizeCurrency(transaction.currency) === "USD") {
          hasUsd = true;
          usdNet += signed;
        }
      }
      return {
        day,
        label: dayLabel(day, today),
        transactions: items,
        arsNet: roundMoney(arsNet),
        usdNet: roundMoney(usdNet),
        hasArs,
        hasUsd,
      };
    });
}

/** Días ya vividos del rango, incluyendo los que no tienen movimientos. */
export function elapsedDays(range: DateRange, today: string): number {
  const end = range.to < today ? range.to : today;
  if (end < range.from) return 1;
  return Math.max(1, daysBetween(range.from, end) + 1);
}

export function summarize(
  transactions: Transaction[],
  range: DateRange,
  today: string,
  currency: CurrencyFilter,
  type: TypeFilter
): FilterSummary {
  let arsExpense = 0;
  let arsIncome = 0;
  let usdExpense = 0;
  let usdIncome = 0;
  let hasUsd = false;
  for (const transaction of transactions) {
    if (transaction.countsInBalance === false || !Number.isFinite(transaction.amount)) continue;
    const code = normalizeCurrency(transaction.currency);
    if (code === "USD") {
      hasUsd = true;
      if (transaction.type === "expense") usdExpense += transaction.amount;
      else usdIncome += transaction.amount;
    } else if (isArs(transaction.currency)) {
      if (transaction.type === "expense") arsExpense += transaction.amount;
      else arsIncome += transaction.amount;
    }
  }
  const useUsd = currency === "USD";
  const side = type === "income" ? "income" : "expense";
  const total = roundMoney(
    side === "income"
      ? useUsd ? usdIncome : arsIncome
      : useUsd ? usdExpense : arsExpense
  );
  const days = elapsedDays(range, today);
  return {
    count: transactions.length,
    total,
    side,
    currency: useUsd ? "USD" : "ARS",
    average: roundMoney(total / days),
    days,
    usdAside: !useUsd && hasUsd,
  };
}

/** Total del día del mismo lado que la tira. Un día mixto muestra el gasto, no el neto. */
export function dayHeadline(
  transactions: Transaction[],
  type: TypeFilter,
  currency: CurrencyFilter
): { amount: number; currency: "ARS" | "USD"; tone: "income" | "neutral"; aside: number | null } {
  let arsExpense = 0;
  let arsIncome = 0;
  let usdExpense = 0;
  let usdIncome = 0;
  let hasUsd = false;
  for (const transaction of transactions) {
    if (transaction.countsInBalance === false || !Number.isFinite(transaction.amount)) continue;
    const code = normalizeCurrency(transaction.currency);
    if (code === "USD") {
      hasUsd = true;
      if (transaction.type === "expense") usdExpense += transaction.amount;
      else usdIncome += transaction.amount;
    } else if (isArs(transaction.currency)) {
      if (transaction.type === "expense") arsExpense += transaction.amount;
      else arsIncome += transaction.amount;
    }
  }
  const useUsd = currency === "USD";
  const code = useUsd ? "USD" : "ARS";
  const expense = roundMoney(useUsd ? usdExpense : arsExpense);
  const income = roundMoney(useUsd ? usdIncome : arsIncome);
  if (type === "income" || (type === "all" && expense === 0 && income > 0)) {
    return { amount: income, currency: code, tone: income > 0 ? "income" : "neutral", aside: null };
  }
  return {
    amount: -expense,
    currency: code,
    tone: "neutral",
    aside: !useUsd && hasUsd ? -roundMoney(usdExpense) : null,
  };
}

export interface WalletParts {
  sign: string;
  symbol: string;
  integer: string;
  /** Incluye la coma. Null si no hay centavos, así no aparece ",00". */
  fraction: string | null;
}

/** Parte un monto para una cifra de billetera: el entero manda, el signo y los centavos no. */
export function walletParts(amount: number, currency: "ARS" | "USD"): WalletParts {
  const rounded = roundMoney(amount);
  const sign = rounded < 0 ? "−" : rounded > 0 ? "+" : "";
  const absolute = Math.abs(rounded);
  const cents = Math.abs(absolute - Math.round(absolute)) >= 0.001;
  const formatted = absolute.toLocaleString("es-AR", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: 2,
  });
  const [integer, fraction] = formatted.split(",");
  return {
    sign,
    symbol: currency === "USD" ? "US$" : "$",
    integer: integer ?? formatted,
    fraction: fraction ? `,${fraction}` : null,
  };
}

export function signedFormat(amount: number, currency: "ARS" | "USD"): string {
  const rounded = roundMoney(amount);
  const body = currency === "ARS" ? formatPesos(Math.abs(rounded)) : formatMoney(Math.abs(rounded), "USD");
  if (rounded > 0) return `+${body}`;
  if (rounded < 0) return `−${body}`;
  return body;
}

export function movementAmount(transaction: Transaction): string {
  const signed = transaction.type === "expense" ? -transaction.amount : transaction.amount;
  const code = normalizeCurrency(transaction.currency);
  if (code === "ARS" || code === "USD") return signedFormat(signed, code);
  const rounded = roundMoney(signed);
  const body = formatMoney(Math.abs(rounded), code).replace(/^−/, "");
  if (rounded > 0) return `+${body}`;
  if (rounded < 0) return `−${body}`;
  return body;
}

export function weekdayPattern(transactions: Transaction[], currency: CurrencyFilter): WeekdayPattern {
  const useUsd = currency === "USD";
  const expense = [0, 0, 0, 0, 0, 0, 0];
  const income = [0, 0, 0, 0, 0, 0, 0];

  for (const transaction of transactions) {
    if (transaction.countsInBalance === false || !Number.isFinite(transaction.amount)) continue;
    const code = normalizeCurrency(transaction.currency);
    if (useUsd ? code !== "USD" : !isArs(transaction.currency)) continue;
    const index = (weekdayISO(civilDay(transaction.date)) + 6) % 7;
    if (transaction.type === "expense") expense[index] += transaction.amount;
    else income[index] += transaction.amount;
  }

  const expenseTotal = expense.reduce((sum, value) => sum + value, 0);
  const incomeTotal = income.reduce((sum, value) => sum + value, 0);
  const showIncome = expenseTotal === 0 && incomeTotal > 0;
  const values = showIncome ? income : expense;
  const title = showIncome ? "En qué días entra" : "En qué días se va";
  const buckets = WEEKDAYS.map((weekday, index) => ({
    key: weekday.key,
    label: weekday.label,
    value: roundMoney(values[index] ?? 0),
  }));
  const max = Math.max(...buckets.map((bucket) => bucket.value));
  const peaks = buckets.filter((bucket) => max > 0 && bucket.value === max);
  const peak = peaks.length === 1 ? peaks[0] : null;
  const peakLabel = peak ? `El ${WEEKDAY_LONG[buckets.indexOf(peak)]} es el día más alto.` : null;

  return {
    title,
    currency: useUsd ? "USD" : "ARS",
    buckets,
    peakLabel,
  };
}
