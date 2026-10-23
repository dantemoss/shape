/**
 * Fechas civiles de la app. Un YYYY-MM-DD es un día en Argentina,
 * no un instante UTC. `new Date("2026-10-01")` cae el 30 de septiembre
 * en America/Argentina/Buenos_Aires; por eso no se usa.
 */
export const APP_TIME_ZONE = "America/Argentina/Buenos_Aires";

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})/;

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

export function dateParts(value: string): DateParts | null {
  const match = ISO_DAY.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export function toISO(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function monthKey(value: string): string | null {
  const parts = dateParts(value);
  if (!parts) return null;
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}`;
}

/** Día calendario en Argentina para un instante. */
export function todayISO(now: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return formatted;
}

export function argentinaHour(now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(now)
    .find((part) => part.type === "hour")?.value;
  const parsed = Number(hour ?? "0");
  if (!Number.isFinite(parsed) || parsed === 24) return 0;
  return parsed;
}

/**
 * Date local cuyas componentes coinciden con el día guardado.
 * date-fns y los getters locales muestran ese día en cualquier zona.
 */
export function parseDateOnly(value: string): Date {
  const parts = dateParts(value);
  if (!parts) return new Date(NaN);
  return new Date(parts.year, parts.month - 1, parts.day);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addDaysISO(value: string, days: number): string {
  const parts = dateParts(value);
  if (!parts) return value;
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return toISO(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

export function addMonthsISO(value: string, delta: number): string {
  const parts = dateParts(value);
  if (!parts) return value;
  const index = parts.year * 12 + (parts.month - 1) + delta;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  const day = Math.min(parts.day, daysInMonth(year, month));
  return toISO(year, month, day);
}

/** Diferencia en días civiles: `to - from`. */
export function daysBetween(from: string, to: string): number {
  const start = dateParts(from);
  const end = dateParts(to);
  if (!start || !end) return 0;
  const startUtc = Date.UTC(start.year, start.month - 1, start.day);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);
  return Math.round((endUtc - startUtc) / 86_400_000);
}

export function weekdayISO(value: string): number {
  const parts = dateParts(value);
  if (!parts) return 0;
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

export function clampMonthDay(year: number, month: number, day: number): string {
  const last = daysInMonth(year, month);
  return toISO(year, month, Math.min(Math.max(day, 1), last));
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export type CalendarWindow = "month" | "3m" | "6m" | "year";

/** Primer día incluido de una ventana de mes calendario, anclada en `today`. */
export function calendarWindowStart(window: CalendarWindow, today: string): string {
  const parts = dateParts(today);
  if (!parts) return today;
  if (window === "year") return toISO(parts.year, 1, 1);
  const back = window === "month" ? 0 : window === "3m" ? 2 : 5;
  const shifted = shiftMonth(parts.year, parts.month, -back);
  return toISO(shifted.year, shifted.month, 1);
}

export function formatMonthShort(yearMonth: string): string {
  const [yearText, monthText] = yearMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!year || !month) return yearMonth;
  const date = new Date(Date.UTC(year, month - 1, 15));
  return new Intl.DateTimeFormat("es-AR", { month: "short", timeZone: "UTC" }).format(date);
}
