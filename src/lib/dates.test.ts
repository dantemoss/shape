import assert from "node:assert/strict";
import test from "node:test";
import {
  addDaysISO,
  addMonthsISO,
  argentinaHour,
  calendarWindowStart,
  daysBetween,
  monthKey,
  parseDateOnly,
  todayISO,
} from "./dates";

test("hoy en Argentina sigue siendo el 23 cuando en UTC ya es el 24", () => {
  const instant = new Date("2026-10-24T02:30:00.000Z");
  assert.equal(todayISO(instant), "2026-10-23");
  assert.equal(argentinaHour(instant), 23);
});

test("un YYYY-MM-DD se lee como ese día civil, no como UTC", () => {
  const date = parseDateOnly("2026-10-01");
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 9);
  assert.equal(date.getDate(), 1);
  assert.equal(monthKey("2026-10-01"), "2026-10");
});

test("la aritmética de días no depende de la zona del servidor", () => {
  assert.equal(addDaysISO("2026-10-23", 33), "2026-11-25");
  assert.equal(daysBetween("2026-10-23", "2026-11-25"), 33);
  assert.equal(addMonthsISO("2026-01-31", 1), "2026-02-28");
  assert.equal(calendarWindowStart("month", "2026-10-23"), "2026-10-01");
  assert.equal(calendarWindowStart("3m", "2026-10-23"), "2026-08-01");
  assert.equal(calendarWindowStart("year", "2026-10-23"), "2026-01-01");
});
