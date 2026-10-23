import assert from "node:assert/strict";
import test from "node:test";
import { getMonthComparison } from "./health-utils";
import {
  adjustmentForTarget,
  buildMoneySnapshot,
  computeAccountBalance,
  monthSeries,
  sumCalendarWindow,
} from "./money";
import type { SalaryConfig } from "./types";

const salary: SalaryConfig = {
  amount: 1_000_000,
  frequency: "monthly",
  payDay: 25,
  label: "Sueldo",
};

const today = "2026-10-23";

test("el saldo es la base más ingresos menos gastos en pesos desde esa fecha", () => {
  const balance = computeAccountBalance(
    { startingBalance: 200_000, startingDate: "2026-10-01" },
    [
      { type: "expense", amount: 50_000, date: "2026-09-30", currency: "ARS" },
      { type: "expense", amount: 20_000, date: "2026-10-10", currency: "ARS" },
      { type: "income", amount: 1_000_000, date: "2026-10-23", currency: "ARS", kind: "salary", id: "sueldo" },
      { type: "expense", amount: 100, date: "2026-10-12", currency: "USD" },
      { type: "expense", amount: 5_000, date: "2026-10-24", currency: "ARS" },
      { type: "income", amount: 9_000, date: "2026-10-11", currency: "ARS", countsInBalance: false },
    ],
    [{ amount: -3_000, date: "2026-10-20" }],
    today
  );

  assert.equal(balance.balance, 200_000 - 20_000 + 1_000_000 - 3_000);
  assert.equal(balance.income, 1_000_000);
  assert.equal(balance.expense, 20_000);
  assert.equal(balance.adjustments, -3_000);
});

test("ajustar al saldo real anota la diferencia y no pisa la base", () => {
  assert.equal(adjustmentForTarget(1_177_000, 1_150_000), -27_000);
  assert.equal(adjustmentForTarget(1_150_000, 1_150_000), null);

  const reconciled = computeAccountBalance(
    { startingBalance: 200_000, startingDate: "2026-10-01" },
    [{ type: "income", amount: 1_000_000, date: "2026-10-23", currency: "ARS" }],
    [{ amount: -50_000, date: "2026-10-23" }],
    today
  );
  assert.equal(reconciled.balance, 1_150_000);
});

test("cobrar antes no suma el sueldo esperado encima de la plata que ya está", () => {
  const before = buildMoneySnapshot({
    account: { startingBalance: 200_000, startingDate: "2026-10-01" },
    transactions: [{ type: "expense", amount: 50_000, date: "2026-10-10", currency: "ARS" }],
    adjustments: [],
    salaryConfig: salary,
    salaryPayments: [],
    today,
  });
  assert.equal(before.account.balance, 150_000);
  assert.equal(before.payPeriod?.salaryReceived, 0);
  assert.equal(before.payPeriod?.salaryExpected, 1_000_000);
  assert.equal(before.payPeriod?.end, "2026-10-25");
  assert.equal(before.payPeriod?.start, "2026-09-25");

  const after = buildMoneySnapshot({
    account: { startingBalance: 200_000, startingDate: "2026-10-01" },
    transactions: [
      { type: "expense", amount: 50_000, date: "2026-10-10", currency: "ARS" },
      {
        id: "ingreso-sueldo",
        type: "income",
        amount: 1_000_000,
        date: "2026-10-23",
        currency: "ARS",
        kind: "salary",
      },
    ],
    adjustments: [],
    salaryConfig: salary,
    salaryPayments: [
      { id: "cobro", amount: 1_000_000, date: "2026-10-23", periodKey: "2026-10-25", incomeId: "ingreso-sueldo" },
    ],
    today,
  });

  assert.equal(after.account.balance, 1_150_000);
  assert.equal(after.payPeriod?.start, "2026-10-23");
  assert.equal(after.payPeriod?.end, "2026-11-25");
  assert.equal(after.payPeriod?.salaryReceived, 1_000_000);
  assert.equal(after.payPeriod?.expense, 0);
  assert.notEqual(after.account.balance, salary.amount - 50_000 + 1_000_000);
});

test("el 1 de octubre cuenta en octubre y el dólar no entra a los pesos", () => {
  const transactions = [
    { type: "expense" as const, amount: 10, date: "2026-10-01", currency: "ARS" },
    { type: "expense" as const, amount: 80, date: "2026-10-02", currency: "USD" },
    { type: "income" as const, amount: 40, date: "2026-10-05", currency: "ARS" },
    { type: "expense" as const, amount: 7, date: "2026-09-30", currency: "ARS" },
  ];
  const snapshot = buildMoneySnapshot({
    account: { startingBalance: 0, startingDate: "2026-09-01" },
    transactions,
    adjustments: [],
    salaryConfig: salary,
    salaryPayments: [],
    today,
  });

  assert.equal(snapshot.calendarMonth.expense, 10);
  assert.equal(snapshot.calendarMonth.income, 40);
  assert.equal(snapshot.usd.expense, 80);
  assert.equal(snapshot.account.balance, 40 - 10 - 7);

  const monthWindow = sumCalendarWindow(transactions, "month", today);
  assert.equal(monthWindow.expense, snapshot.calendarMonth.expense);
  assert.equal(monthWindow.income, snapshot.calendarMonth.income);
  const series = monthSeries(transactions, today, 6);
  assert.equal(series[series.length - 1].expense, snapshot.calendarMonth.expense);
  assert.equal(series[series.length - 1].income, snapshot.calendarMonth.income);
  assert.equal(series[series.length - 2].expense, 7);

  const comparison = getMonthComparison(
    transactions.map((transaction, index) => ({
      id: String(index),
      type: transaction.type,
      amount: transaction.amount,
      description: "Movimiento",
      category: "other" as const,
      recurrence: "once" as const,
      date: transaction.date,
      hasInstallments: false,
      createdAt: "2026-10-01T00:00:00.000Z",
      currency: transaction.currency,
    })),
    today
  );
  assert.equal(comparison.current, 10);
  assert.equal(comparison.previous, 7);
});
