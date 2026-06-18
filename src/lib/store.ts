"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Transaction, Goal, SalaryConfig, SalaryPayment } from "./types";

interface ShapeStore {
  transactions: Transaction[];
  goals: Goal[];
  salaryConfig: SalaryConfig | null;
  salaryPayments: SalaryPayment[];
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => void;
  removeTransaction: (id: string) => void;
  addGoal: (goal: Omit<Goal, "id" | "createdAt">) => void;
  updateGoalAmount: (id: string, amount: number) => void;
  removeGoal: (id: string) => void;
  setSalaryConfig: (config: SalaryConfig) => void;
  clearSalaryConfig: () => void;
  addSalaryPayment: (payment: Omit<SalaryPayment, "id">) => void;
  removeSalaryPayment: (id: string) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const useShapeStore = create<ShapeStore>()(
  persist(
    (set) => ({
      transactions: [],
      goals: [],
      salaryConfig: null,
      salaryPayments: [],

      addTransaction: (tx) =>
        set((state) => ({
          transactions: [
            {
              ...tx,
              id: generateId(),
              createdAt: new Date().toISOString(),
            },
            ...state.transactions,
          ],
        })),

      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      addGoal: (goal) =>
        set((state) => ({
          goals: [
            {
              ...goal,
              id: generateId(),
              createdAt: new Date().toISOString(),
            },
            ...state.goals,
          ],
        })),

      updateGoalAmount: (id, amount) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? { ...g, currentAmount: Math.min(g.currentAmount + amount, g.targetAmount) }
              : g
          ),
        })),

      removeGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      setSalaryConfig: (config) => set({ salaryConfig: config }),

      clearSalaryConfig: () => set({ salaryConfig: null }),

      addSalaryPayment: (payment) =>
        set((state) => ({
          salaryPayments: [
            {
              ...payment,
              id: generateId(),
            },
            ...state.salaryPayments,
          ],
        })),

      removeSalaryPayment: (id) =>
        set((state) => ({
          salaryPayments: state.salaryPayments.filter((p) => p.id !== id),
        })),
    }),
    {
      name: "shape-storage",
    }
  )
);

export function useFinancialSummary() {
  const transactions = useShapeStore((s) => s.transactions);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const monthlyData = buildMonthlyData(transactions);
  const categoryData = buildCategoryData(transactions);

  return { totalIncome, totalExpenses, balance, monthlyData, categoryData };
}

function buildMonthlyData(transactions: Transaction[]) {
  const months: Record<string, { income: number; expenses: number }> = {};

  transactions.forEach((t) => {
    const date = new Date(t.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!months[key]) months[key] = { income: 0, expenses: 0 };
    if (t.type === "income") months[key].income += t.amount;
    else months[key].expenses += t.amount;
  });

  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({
      month: formatMonth(month),
      ...data,
    }));
}

function buildCategoryData(transactions: Transaction[]) {
  const categories: Record<string, number> = {};

  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      if (!categories[t.category]) categories[t.category] = 0;
      categories[t.category] += t.amount;
    });

  return Object.entries(categories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));
}

function formatMonth(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
}
