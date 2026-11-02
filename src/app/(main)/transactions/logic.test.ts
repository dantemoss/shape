import assert from "node:assert/strict";
import test from "node:test";
import type { Transaction } from "@/lib/types";
import {
  civilDay,
  dayLabel,
  elapsedDays,
  groupByDay,
  matchesQuery,
  movementClock,
  periodRange,
  signedFormat,
  summarize,
  walletParts,
  weekdayPattern,
} from "./logic";

function tx(partial: Partial<Transaction> & Pick<Transaction, "id" | "date" | "amount" | "type">): Transaction {
  return {
    description: partial.description ?? "Movimiento",
    category: partial.category ?? "other",
    recurrence: "once",
    hasInstallments: false,
    createdAt: partial.createdAt ?? partial.date,
    currency: partial.currency ?? "ARS",
    countsInBalance: partial.countsInBalance ?? true,
    ...partial,
  };
}

test("el día civil sale de los primeros 10 caracteres, no de UTC", () => {
  assert.equal(civilDay("2026-10-01"), "2026-10-01");
  assert.equal(civilDay("2026-10-01T00:00:00.000Z"), "2026-10-01");
  const grouped = groupByDay(
    [tx({ id: "a", date: "2026-10-01", amount: 10, type: "expense", description: "Alquiler" })],
    "2026-11-02"
  );
  assert.equal(grouped[0]?.day, "2026-10-01");
  assert.equal(grouped[0]?.label, "Jueves 1 oct");
  assert.equal(dayLabel("2026-11-02", "2026-11-02"), "Hoy");
  assert.equal(dayLabel("2026-11-01", "2026-11-02"), "Ayer");
  assert.equal(dayLabel("2026-10-27", "2026-11-02"), "Martes 27 oct");
});

test("el reloj solo aparece si el instante cae en ese día de Argentina", () => {
  const matched = tx({
    id: "b",
    date: "2026-11-02",
    createdAt: "2026-11-02T18:30:00.000Z",
    amount: 20,
    type: "expense",
  });
  assert.match(movementClock(matched) ?? "", /15:30/);

  const shifted = tx({
    id: "c",
    date: "2026-11-02",
    createdAt: "2026-11-02T01:30:00.000Z",
    amount: 20,
    type: "expense",
  });
  assert.equal(movementClock(shifted), null);

  const dateOnly = tx({ id: "d", date: "2026-11-02", amount: 20, type: "expense" });
  assert.equal(movementClock(dateOnly), null);
});

test("los dólares no entran en el total en pesos", () => {
  const rows = [
    tx({ id: "ars", date: "2026-11-01", amount: 1000, type: "expense" }),
    tx({ id: "usd", date: "2026-11-01", amount: 42, type: "expense", currency: "USD" }),
    tx({ id: "in", date: "2026-11-02", amount: 300, type: "income" }),
    tx({ id: "skip", date: "2026-11-02", amount: 999, type: "expense", countsInBalance: false }),
  ];
  const summary = summarize(rows, { from: "2026-11-01", to: "2026-11-02" }, "2026-11-02", "all", "expense");
  assert.equal(summary.total, 1000);
  assert.equal(summary.side, "expense");
  assert.equal(summary.count, 4);
  assert.equal(summary.days, 2);
  assert.equal(summary.average, 500);
  assert.equal(summary.usdAside, true);
  assert.equal(summary.currency, "ARS");

  const mixed = summarize(rows, { from: "2026-11-01", to: "2026-11-02" }, "2026-11-02", "all", "all");
  assert.equal(mixed.total, 1000);
  assert.equal(mixed.side, "expense");

  const dollars = summarize(rows, { from: "2026-11-01", to: "2026-11-02" }, "2026-11-02", "USD", "expense");
  assert.equal(dollars.total, 42);
  assert.equal(dollars.currency, "USD");
  assert.equal(dollars.usdAside, false);

  const day = groupByDay(rows, "2026-11-02").find((group) => group.day === "2026-11-01");
  assert.equal(day?.arsNet, -1000);
  assert.equal(day?.usdNet, -42);
});

test("el período de cobro no incluye el día de cierre", () => {
  assert.deepEqual(periodRange({ start: "2026-10-05", end: "2026-11-05" }, "2026-11-02"), {
    from: "2026-10-05",
    to: "2026-11-04",
  });
  assert.equal(elapsedDays({ from: "2026-10-05", to: "2026-11-04" }, "2026-11-02"), 29);
});

test("la búsqueda mira comercio y descripción, sin acentos", () => {
  const row = tx({
    id: "e",
    date: "2026-11-01",
    amount: 10,
    type: "expense",
    merchant: "Coto",
    description: "Farmacia",
  });
  assert.equal(matchesQuery(row, "coto"), true);
  assert.equal(matchesQuery(row, "FARMACIA"), true);
  assert.equal(matchesQuery(row, "ypf"), false);
  assert.equal(matchesQuery(row, "  "), true);
});

test("el patrón semanal suma pesos y arranca el lunes", () => {
  const pattern = weekdayPattern(
    [
      tx({ id: "mon", date: "2026-10-26", amount: 100, type: "expense", category: "food" }),
      tx({ id: "mon2", date: "2026-11-02", amount: 50, type: "expense", category: "food" }),
      tx({ id: "usd", date: "2026-10-26", amount: 9, type: "expense", currency: "USD" }),
      tx({ id: "sun", date: "2026-11-01", amount: 20, type: "expense" }),
    ],
    "all"
  );
  assert.equal(pattern.buckets[0]?.label, "Lun");
  assert.equal(pattern.buckets[0]?.value, 150);
  assert.equal(pattern.buckets[6]?.value, 20);
  assert.equal(pattern.currency, "ARS");
  assert.equal(pattern.peakLabel, "El lunes es el día más alto.");
  assert.equal(signedFormat(-1500, "ARS").startsWith("−$"), true);
  assert.equal(signedFormat(1500, "USD").startsWith("+US$"), true);
  const whole = walletParts(-1213661, "ARS");
  assert.equal(whole.sign, "−");
  assert.equal(whole.symbol, "$");
  assert.equal(whole.integer, "1.213.661");
  assert.equal(whole.fraction, null);
  const cents = walletParts(10.5, "ARS");
  assert.equal(cents.fraction, ",50");
  assert.equal(walletParts(42, "USD").symbol, "US$");
});
