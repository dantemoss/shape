import assert from "node:assert/strict";
import test from "node:test";
import {
  alignedSpendDays,
  allowance,
  averageElapsedSpend,
  balanceSeries,
  categoryStrip,
  expenseDonut,
  merchantCard,
  monthlyFlow,
} from "./chart-series";
import type { Transaction } from "./types";

const today = "2026-10-30";

function expense(partial: Partial<Transaction> & Pick<Transaction, "amount" | "date">): Transaction {
  return {
    id: partial.id ?? partial.date + partial.amount,
    type: "expense",
    description: partial.merchant ?? "Gasto",
    category: partial.category ?? "food",
    recurrence: "once",
    hasInstallments: false,
    createdAt: partial.date,
    currency: "ARS",
    countsInBalance: true,
    ...partial,
  };
}

test("el flujo mensual ignora dólares y movimientos que no suman", () => {
  const points = monthlyFlow(
    [
      { type: "income", amount: 1000, date: "2026-10-02", currency: "ARS" },
      { type: "expense", amount: 400, date: "2026-10-03", currency: "ARS" },
      { type: "expense", amount: 50, date: "2026-10-03", currency: "USD" },
      { type: "expense", amount: 80, date: "2026-10-04", currency: "ARS", countsInBalance: false },
    ],
    today,
    2
  );
  const october = points.find((point) => point.key === "2026-10");
  assert.equal(points.length, 2);
  assert.equal(october?.income, 1000);
  assert.equal(october?.expense, 400);
  assert.equal(october?.label.toLocaleLowerCase("es-AR").startsWith("oct"), true);
});

test("los días futuros del período no entran al promedio", () => {
  const days = alignedSpendDays(
    [
      { type: "expense", amount: 100, date: "2026-10-29", currency: "ARS" },
      { type: "expense", amount: 300, date: "2026-10-30", currency: "ARS" },
      { type: "expense", amount: 900, date: "2026-10-31", currency: "ARS" },
      { type: "expense", amount: 40, date: "2026-10-26", currency: "ARS" },
    ],
    "2026-10-29",
    "2026-11-01",
    today
  );
  assert.equal(days.length, 3);
  assert.equal(days[2]?.future, true);
  assert.equal(days[2]?.current, 0);
  assert.equal(days[0]?.previous, 40);
  assert.equal(averageElapsedSpend(days), 200);
});

test("el saldo en el tiempo usa la base y los ajustes", () => {
  const series = balanceSeries(
    { startingBalance: 1000, startingDate: "2026-10-01" },
    [{ type: "expense", amount: 100, date: "2026-10-10", currency: "ARS" }],
    [{ amount: 50, date: "2026-10-20" }],
    today,
    1
  );
  assert.equal(series[0]?.balance, 950);
  assert.equal(series[0]?.hasBaseline, true);
});

test("los comercios salen del campo merchant y dejan afuera dólares", () => {
  const card = merchantCard(
    [
      expense({ amount: 200, date: "2026-10-28", merchant: "YPF", category: "transport" }),
      expense({ amount: 200, date: "2026-10-20", merchant: "ypf", category: "transport" }),
      expense({ amount: 500, date: "2026-10-21", merchant: "Carrefour", category: "food" }),
      expense({ amount: 90, date: "2026-10-21", currency: "USD", merchant: "Netflix" }),
      expense({ amount: 70, date: "2026-10-21" }),
    ],
    today,
    30
  );
  assert.deepEqual(
    card.rows.map((row) => row.name),
    ["Carrefour", "YPF"]
  );
  assert.equal(card.total, 900);
  assert.equal(card.spark.length, 7);
});

test("la dona agrupa el resto y la tira reparte porcentajes", () => {
  const transactions = [
    expense({ amount: 500, date: "2026-10-02", category: "food" }),
    expense({ amount: 300, date: "2026-10-03", category: "transport" }),
    expense({ amount: 100, date: "2026-10-04", category: "health" }),
    expense({ amount: 50, date: "2026-10-05", category: "clothing" }),
    expense({ amount: 50, date: "2026-10-06", category: "other" }),
  ];
  const donut = expenseDonut(transactions, "2026-10-01", today);
  assert.equal(donut.total, 1000);
  assert.equal(donut.slices.at(-1)?.label, "Resto");
  assert.equal(donut.slices.at(-1)?.hatch, true);

  const strip = categoryStrip(transactions, "2026-10-01", today);
  assert.equal(
    strip.reduce((sum, segment) => sum + segment.pct, 0),
    100
  );
});

test("lo que queda por día no es negativo", () => {
  assert.deepEqual(allowance(1000, 400, 4), { expected: 1000, spent: 400, left: 600, perDay: 150, pct: 40 });
  assert.equal(allowance(1000, 1200, 3).perDay, 0);
  assert.equal(allowance(1000, 1200, 3).left, -200);
});
