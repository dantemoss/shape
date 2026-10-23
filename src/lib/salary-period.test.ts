import assert from "node:assert/strict";
import test from "node:test";
import {
  getCurrentPayPeriod,
  periodKeyForPayment,
  planSalaryRegistration,
} from "./salary-utils";
import { reviewSalaryRecords, unambiguousSalaryLinks } from "./salary-links";
import type { SalaryConfig } from "./types";

const monthly: SalaryConfig = {
  amount: 1_000_000,
  frequency: "monthly",
  payDay: 25,
  label: "Mi sueldo",
};

test("sin cobros, el período va del día configurado anterior al próximo", () => {
  const period = getCurrentPayPeriod(monthly, [], "2026-10-23");
  assert.equal(period.source, "schedule");
  assert.equal(period.start, "2026-09-25");
  assert.equal(period.end, "2026-10-25");
  assert.equal(period.daysLeft, 2);
});

test("cobrar el 23 abre el período ese día y el próximo cobro es el 25 del mes siguiente", () => {
  const plan = planSalaryRegistration(monthly, [], "2026-10-23");
  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.equal(plan.periodKey, "2026-10-25");
  assert.equal(plan.nextPayday, "2026-11-25");

  const period = getCurrentPayPeriod(
    monthly,
    [{ date: "2026-10-23", periodKey: plan.periodKey }],
    "2026-10-23"
  );
  assert.equal(period.source, "payment");
  assert.equal(period.start, "2026-10-23");
  assert.equal(period.end, "2026-11-25");
  assert.equal(period.daysLeft, 33);

  const again = planSalaryRegistration(
    monthly,
    [{ date: "2026-10-23", periodKey: "2026-10-25" }],
    "2026-10-24"
  );
  assert.equal(again.ok, false);
  if (again.ok) return;
  assert.match(again.reason, /este período/);
});

test("un cobro viejo sin period_key también bloquea el duplicado", () => {
  const plan = planSalaryRegistration(monthly, [{ date: "2026-10-23" }], "2026-10-25");
  assert.equal(plan.ok, false);
  assert.equal(periodKeyForPayment(monthly, "2026-10-25"), "2026-10-25");
  assert.equal(periodKeyForPayment(monthly, "2026-02-10"), "2026-02-25");
});

test("quincena y semana usan el día configurado siguiente", () => {
  const biweekly: SalaryConfig = {
    amount: 100,
    frequency: "biweekly",
    payDay: 10,
    payDay2: 25,
    label: "Sueldo",
  };
  assert.equal(periodKeyForPayment(biweekly, "2026-10-09"), "2026-10-10");
  const early = planSalaryRegistration(biweekly, [], "2026-10-09");
  assert.equal(early.ok && early.nextPayday, "2026-10-25");

  const weekly: SalaryConfig = { amount: 100, frequency: "weekly", payDay: 5, label: "Sueldo" };
  assert.equal(periodKeyForPayment(weekly, "2026-10-21"), "2026-10-23");
  const week = planSalaryRegistration(weekly, [], "2026-10-21");
  assert.equal(week.ok && week.nextPayday, "2026-10-30");
});

test("la migración automática solo vincula cuando hay un único candidato", () => {
  const payment = { id: "pago", amount: 1000, date: "2026-10-23", note: "con bono" };
  const match = {
    id: "ingreso",
    type: "income" as const,
    amount: 1000,
    date: "2026-10-23",
    description: "con bono",
  };
  const other = { ...match, id: "otro", description: "Freelance" };

  assert.deepEqual(unambiguousSalaryLinks([payment], [match, other], "Mi sueldo"), [
    { paymentId: "pago", incomeId: "ingreso" },
  ]);

  const duplicate = { ...match, id: "copia" };
  assert.deepEqual(unambiguousSalaryLinks([payment], [match, duplicate], "Mi sueldo"), []);

  const review = reviewSalaryRecords(
    [{ ...payment, incomeId: "ingreso" }],
    [match, { ...duplicate, countsInBalance: true }],
    "Mi sueldo",
    monthly
  );
  assert.deepEqual(review.extras, [{ incomeId: "copia", paymentId: "pago" }]);
  assert.equal(review.unlinked.length, 0);
});
