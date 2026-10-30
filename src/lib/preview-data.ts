import { addDaysISO, addMonthsISO, monthKey, todayISO } from "./dates";
import type { ShapeData } from "./db";
import type { ExpenseCategory, Transaction } from "./types";

const CATEGORIES: ExpenseCategory[] = [
  "food",
  "transport",
  "housing",
  "subscriptions",
  "health",
  "entertainment",
  "savings",
];

const MERCHANTS = ["Carrefour", "YPF", "Farmacity", "Netflix", "Mercado Libre", "Coto", ""];

function wave(index: number): number {
  const base = 14000 + (index % 5) * 6200 + ((index * 3) % 7) * 2800;
  return Math.round(base / 10) * 10;
}

export function buildPreviewData(today = todayISO()): ShapeData {
  const monthStart = `${monthKey(today) ?? today.slice(0, 7)}-01`;
  const payDay = addDaysISO(monthStart, 4);
  const periodStart = payDay <= today ? payDay : addMonthsISO(payDay, -1);
  const transactions: Transaction[] = [];
  let serial = 0;

  function push(partial: Omit<Transaction, "id" | "createdAt" | "recurrence" | "hasInstallments"> & Partial<Transaction>) {
    serial += 1;
    transactions.push({
      recurrence: "once",
      hasInstallments: false,
      currency: "ARS",
      countsInBalance: true,
      ...partial,
      id: `preview-${serial}`,
      createdAt: partial.date,
    });
  }

  for (let monthOffset = 7; monthOffset >= 0; monthOffset -= 1) {
    const start = addMonthsISO(monthStart, -monthOffset);
    const factor = [0.72, 0.5, 0.64, 0.46, 0.88, 0.58, 0.7, 0.8][7 - monthOffset] ?? 0.7;
    const payday = addDaysISO(start, 4);
    if (payday <= today) {
      push({
        type: "income",
        amount: 1_850_000,
        description: "Sueldo",
        category: "other",
        date: payday,
        kind: "salary",
        merchant: "Empleador",
      });
    }
    const monthEnd = addDaysISO(addMonthsISO(start, 1), -1);
    const lastDay = monthEnd < today ? monthEnd : today;
    for (let day = 0; day <= 40; day += 1) {
      const date = addDaysISO(start, day);
      if (date > lastDay) break;
      if (day % 7 === 3) continue;
      const amount = Math.round(wave(monthOffset * 20 + day) * factor);
      const category = CATEGORIES[(day + monthOffset) % CATEGORIES.length];
      const merchant = MERCHANTS[(day + monthOffset * 2) % MERCHANTS.length];
      push({
        type: "expense",
        amount,
        description: merchant || "Gasto del día",
        category,
        date,
        merchant: merchant || undefined,
      });
      if (day % 9 === 0) {
        push({
          type: "expense",
          amount: Math.round(amount * 0.45),
          description: "Extra",
          category: "food",
          date,
          merchant: "Coto",
        });
      }
    }
  }

  push({
    type: "expense",
    amount: 42,
    description: "Spotify",
    category: "subscriptions",
    date: addDaysISO(today, -2),
    currency: "USD",
    merchant: "Spotify",
  });

  const salaryIncome = transactions.find((transaction) => transaction.kind === "salary" && transaction.date === periodStart);

  return {
    userProfile: { name: "Tin", avatar: null },
    transactions: transactions.sort((a, b) => b.date.localeCompare(a.date)),
    goals: [
      {
        id: "goal-vacaciones",
        name: "Vacaciones",
        targetAmount: 1_200_000,
        currentAmount: 740_000,
        deadline: addMonthsISO(today, 5),
        createdAt: addMonthsISO(today, -2),
      },
      {
        id: "goal-colchon",
        name: "Colchón",
        targetAmount: 1_000_000,
        currentAmount: 260_000,
        createdAt: addMonthsISO(today, -4),
      },
    ],
    salaryConfig: {
      amount: 1_850_000,
      frequency: "monthly",
      payDay: 5,
      label: "Sueldo",
    },
    salaryPayments: salaryIncome
      ? [
          {
            id: "pay-current",
            amount: 1_850_000,
            date: salaryIncome.date,
            incomeId: salaryIncome.id,
            periodKey: salaryIncome.date,
          },
        ]
      : [],
    creditCards: [
      {
        id: "card-visa",
        label: "Visa Galicia",
        network: "visa",
        issuerKey: "galicia",
        creditLimit: 2_000_000,
        usedAmount: 460_000,
        lastFourDigits: "4412",
        createdAt: addMonthsISO(today, -6),
      },
    ],
    cardInstallments: [
      {
        id: "inst-1",
        cardId: "card-visa",
        description: "Auriculares",
        totalAmount: 180_000,
        totalInstallments: 6,
        paidInstallments: 2,
        startDate: addMonthsISO(today, -2),
      },
    ],
    subscriptions: [
      {
        id: "sub-netflix",
        name: "Netflix",
        domain: "netflix.com",
        price: 12_999,
        currency: "ARS",
        period: "monthly",
        startDate: addMonthsISO(today, -3),
        active: true,
        category: "streaming",
        createdAt: addMonthsISO(today, -3),
      },
      {
        id: "sub-spotify",
        name: "Spotify",
        domain: "spotify.com",
        price: 4_999,
        currency: "ARS",
        period: "monthly",
        startDate: addMonthsISO(today, -8),
        active: true,
        category: "music",
        createdAt: addMonthsISO(today, -8),
      },
    ],
    account: {
      id: "mp",
      name: "Mercado Pago",
      currency: "ARS",
      startingBalance: 2_450_000,
      startingDate: addMonthsISO(monthStart, -7),
    },
    adjustments: [],
    ledgerReady: true,
  };
}
