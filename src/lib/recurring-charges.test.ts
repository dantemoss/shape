import assert from "node:assert/strict";
import test from "node:test";
import { detectRecurringCharges } from "./recurring-charges";
import type { Subscription, Transaction } from "./types";

function expense(partial: Pick<Transaction, "id" | "amount" | "date" | "description"> & Partial<Transaction>): Transaction {
  return {
    type: "expense",
    category: "subscriptions",
    recurrence: "once",
    hasInstallments: false,
    currency: "ARS",
    createdAt: partial.date,
    ...partial,
  };
}

const netflix: Subscription = {
  id: "sub-netflix",
  name: "Netflix",
  domain: "netflix.com",
  price: 12_999,
  currency: "ARS",
  period: "monthly",
  startDate: "2026-08-02",
  active: true,
  category: "streaming",
  createdAt: "2026-08-02",
};

test("sugiere un comercio mensual y marca la suba", () => {
  const transactions = [
    expense({ id: "d1", amount: 8_990, date: "2026-08-04", description: "Disney+", merchant: "Disney+" }),
    expense({ id: "d2", amount: 8_990, date: "2026-09-04", description: "Disney+", merchant: "Disney+" }),
    expense({ id: "d3", amount: 10_990, date: "2026-10-04", description: "Disney+", merchant: "Disney+" }),
  ];
  const { suggestions, increases } = detectRecurringCharges(transactions, [netflix]);
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0]?.label, "Disney+");
  assert.equal(suggestions[0]?.increased, true);
  assert.equal(suggestions[0]?.latestAmount, 10_990);
  assert.equal(increases.length, 0);
});

test("ignora comercios con más de un cobro en el mes", () => {
  const transactions = [
    expense({ id: "c1", amount: 20_000, date: "2026-09-02", description: "Carrefour", merchant: "Carrefour" }),
    expense({ id: "c2", amount: 21_000, date: "2026-09-18", description: "Carrefour", merchant: "Carrefour" }),
    expense({ id: "c3", amount: 20_500, date: "2026-10-03", description: "Carrefour", merchant: "Carrefour" }),
  ];
  const { suggestions } = detectRecurringCharges(transactions, []);
  assert.equal(suggestions.length, 0);
});

test("no sugiere una suscripción que ya existe y avisa si el cobro subió", () => {
  const transactions = [
    expense({ id: "n1", amount: 12_999, date: "2026-09-02", description: "Netflix", merchant: "Netflix" }),
    expense({ id: "n2", amount: 15_499, date: "2026-10-02", description: "Netflix", merchant: "Netflix" }),
  ];
  const { suggestions, increases } = detectRecurringCharges(transactions, [netflix]);
  assert.equal(suggestions.length, 0);
  assert.equal(increases.length, 1);
  assert.equal(increases[0]?.subscriptionId, "sub-netflix");
  assert.equal(increases[0]?.latestAmount, 15_499);
});
