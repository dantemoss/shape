import { format } from "date-fns";
import { es } from "date-fns/locale";
import { addDaysISO, parseDateOnly, todayISO } from "./dates";

export function formatIso(value: string, pattern: string): string {
  const date = parseDateOnly(value.slice(0, 10));
  if (Number.isNaN(date.getTime())) return value;
  return format(date, pattern, { locale: es });
}

export function dayHeading(value: string, now: Date = new Date()): string {
  const day = value.slice(0, 10);
  const today = todayISO(now);
  if (day === today) return "Hoy";
  if (day === addDaysISO(today, -1)) return "Ayer";
  const label = formatIso(day, "EEEE d 'de' MMMM");
  return label.charAt(0).toLocaleUpperCase("es-AR") + label.slice(1);
}
