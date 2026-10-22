import assert from "node:assert/strict";
import test from "node:test";
import { legacyHasData, parseLegacySnapshot, summarizeLegacy } from "./legacy-snapshot";

const sample = {
  state: {
    userProfile: { name: "Dante", avatar: null },
    transactions: [
      {
        id: "tx-gasto",
        type: "expense",
        amount: 1500,
        description: "Supermercado",
        category: "food",
        recurrence: "once",
        date: "2026-10-01",
        hasInstallments: false,
        createdAt: "2026-10-01T12:00:00.000Z",
      },
      {
        id: "tx-ingreso",
        type: "income",
        amount: "80000",
        description: "Freelance",
        category: "no-existe",
        recurrence: "monthly",
        date: "2026-10-02T15:00:00.000Z",
        hasInstallments: false,
        createdAt: "2026-10-02T15:00:00.000Z",
      },
      { id: "", type: "expense", amount: 10, date: "2026-01-01" },
    ],
    goals: [
      {
        id: "g1",
        name: "Viaje",
        targetAmount: 1000,
        currentAmount: 5000,
        deadline: "2026-12-01",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    salaryConfig: {
      amount: 900000,
      frequency: "biweekly",
      payDay: 5,
      payDay2: 20,
      label: "Sueldo",
    },
    salaryPayments: [{ id: "p1", amount: 900000, date: "2026-10-05", note: "ok" }],
    creditCards: [
      {
        id: "card-1",
        label: "Visa",
        network: "visa",
        issuerKey: "galicia",
        creditLimit: 100000,
        usedAmount: 10,
        lastFourDigits: "1234",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    cardInstallments: [
      {
        id: "cuota-1",
        cardId: "card-1",
        description: "Notebook",
        totalAmount: 1200000,
        totalInstallments: 12,
        paidInstallments: 2,
        startDate: "2026-03-01",
      },
      {
        id: "huerfana",
        cardId: "no-card",
        description: "Nada",
        totalAmount: 10,
        totalInstallments: 2,
        paidInstallments: 0,
        startDate: "2026-03-01",
      },
    ],
    subscriptions: [
      {
        id: "sub-1",
        name: "Spotify",
        domain: "spotify.com",
        price: 2000,
        currency: "ARS",
        period: "monthly",
        startDate: "2026-01-15",
        active: true,
        category: "music",
        createdAt: "2026-01-15T00:00:00.000Z",
      },
    ],
  },
  version: 0,
};

test("lee el sobre de zustand y descarta filas inválidas", () => {
  const snapshot = parseLegacySnapshot(JSON.stringify(sample));
  assert.ok(snapshot);
  assert.equal(snapshot.userProfile?.name, "Dante");
  assert.equal(snapshot.transactions.length, 2);
  assert.equal(snapshot.transactions[1]?.category, "other");
  assert.equal(snapshot.transactions[1]?.date, "2026-10-02");
  assert.equal(snapshot.goals[0]?.currentAmount, 1000);
  assert.equal(snapshot.salaryConfig?.payDay2, 20);
  assert.equal(snapshot.creditCards.length, 1);
  assert.equal(snapshot.cardInstallments.length, 1);
  assert.equal(snapshot.cardInstallments[0]?.cardId, "card-1");
  assert.equal(snapshot.subscriptions.length, 1);
  assert.equal(legacyHasData(snapshot), true);
  assert.match(summarizeLegacy(snapshot), /2 movimientos/);
  assert.match(summarizeLegacy(snapshot), /1 plan de cuotas/);
});

test("acepta el estado suelto y un JSON vacío", () => {
  const loose = parseLegacySnapshot(JSON.stringify({ transactions: [], goals: [] }));
  assert.ok(loose);
  assert.equal(legacyHasData(loose), false);
  assert.equal(parseLegacySnapshot("no-json"), null);
  assert.equal(summarizeLegacy(loose), "No había datos financieros para importar.");
});
