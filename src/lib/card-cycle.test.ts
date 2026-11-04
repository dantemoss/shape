import assert from "node:assert/strict";
import test from "node:test";
import { cardGlance, cyclePhrase, cuotaLine, nextDayOfMonth } from "./card-cycle";
import type { CardInstallment, CreditCard } from "./types";

const today = "2026-11-04";

test("el próximo día de mes incluye hoy y salta al mes siguiente", () => {
  assert.equal(nextDayOfMonth(today, 25), "2026-11-25");
  assert.equal(nextDayOfMonth(today, 4), "2026-11-04");
  assert.equal(nextDayOfMonth(today, 3), "2026-12-03");
  assert.equal(nextDayOfMonth("2026-11-30", 31), "2026-11-30");
  assert.equal(nextDayOfMonth("2026-04-30", 31), "2026-04-30");
  assert.equal(nextDayOfMonth("2026-05-01", 31), "2026-05-31");
});

test("las frases de cierre y vencimiento", () => {
  assert.equal(cyclePhrase("cierra", 0), "Cierra hoy");
  assert.equal(cyclePhrase("vence", 1), "Vence mañana");
  assert.equal(cyclePhrase("cierra", 21), "Cierra en 21 días");
});

test("el resumen suma las cuotas que entran antes del cierre", () => {
  const card: CreditCard = {
    id: "card-visa",
    label: "Visa Galicia",
    network: "visa",
    issuerKey: "galicia",
    creditLimit: 2_000_000,
    usedAmount: 460_000,
    closingDay: 25,
    dueDay: 10,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  const installments: CardInstallment[] = [
    {
      id: "now",
      cardId: "card-visa",
      description: "Auriculares",
      totalAmount: 180_000,
      totalInstallments: 6,
      paidInstallments: 2,
      startDate: "2026-09-04",
    },
    {
      id: "later",
      cardId: "card-visa",
      description: "Silla",
      totalAmount: 90_000,
      totalInstallments: 3,
      paidInstallments: 0,
      startDate: "2026-12-04",
    },
    {
      id: "done",
      cardId: "card-visa",
      description: "Listo",
      totalAmount: 10_000,
      totalInstallments: 2,
      paidInstallments: 2,
      startDate: "2026-01-04",
    },
  ];

  const glance = cardGlance(card, installments, today);
  assert.equal(glance.closeISO, "2026-11-25");
  assert.equal(glance.dueISO, "2026-11-10");
  assert.equal(glance.closeLabel, "Cierra en 21 días");
  assert.equal(glance.dueLabel, "Vence en 6 días");
  assert.equal(glance.statementFromInstallments, true);
  assert.equal(glance.statement, 30_000);
  assert.equal(glance.thisMonth, 1);
  assert.equal(glance.later, 6);
  assert.equal(glance.available, 1_540_000);
  assert.equal(cuotaLine(glance.thisMonth, glance.later), "1 este mes · 6 después");
});

test("sin cuotas, el resumen es el saldo usado y sin límite no hay barra", () => {
  const card: CreditCard = {
    id: "card-amex",
    label: "Amex",
    network: "amex",
    issuerKey: "santander",
    creditLimit: 0,
    usedAmount: 80_000,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  const glance = cardGlance(card, [], today);
  assert.equal(glance.statement, 80_000);
  assert.equal(glance.statementFromInstallments, false);
  assert.equal(glance.available, null);
  assert.equal(glance.closeLabel, null);
  assert.equal(cuotaLine(0, 0), "Sin cuotas pendientes");
});
