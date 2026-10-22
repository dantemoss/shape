"use client";

import { create } from "zustand";
import type { ShapeData } from "./db";
import type {
  CardInstallment,
  CreditCard,
  Goal,
  SalaryConfig,
  SalaryPayment,
  Subscription,
  Transaction,
  UserProfile,
} from "./types";
import {
  deleteCardInstallment,
  deleteCreditCard,
  deleteGoal,
  deleteSalaryConfig,
  deleteSalaryPayment,
  deleteSubscription,
  deleteTransaction,
  insertCardInstallment,
  insertCreditCard,
  insertGoal,
  insertSalaryPayment,
  insertSubscription,
  insertTransaction,
  loadAll,
  updateCreditCard as updateCreditCardRow,
  updateGoalCurrentAmount,
  updateInstallmentPaid,
  updateProfile,
  updateSubscriptionRow,
  upsertSalaryConfig,
} from "./db";

export type { UserProfile };

export type AuthStatus = "loading" | "anonymous" | "authenticated";

export type ImportNotice =
  | { kind: "imported"; summary: string }
  | { kind: "error"; message: string };

const SYNC_ERROR = "No se pudo guardar el cambio. Revisá tu conexión.";

interface ShapeStore extends ShapeData {
  userId: string | null;
  authStatus: AuthStatus;
  ready: boolean;
  syncError: string | null;
  importNotice: ImportNotice | null;
  legacyPending: boolean;
  importingLegacy: boolean;
  beginSession: (userId: string) => void;
  applyRemote: (data: ShapeData, notice: ImportNotice | null, legacyPending: boolean) => void;
  failSession: (message: string) => void;
  resetSession: () => void;
  dismissImportNotice: () => void;
  dismissSyncError: () => void;
  setUserProfile: (profile: UserProfile) => Promise<void>;
  addCreditCard: (card: Omit<CreditCard, "id" | "createdAt">) => void;
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => void;
  removeCreditCard: (id: string) => void;
  addCardInstallment: (inst: Omit<CardInstallment, "id">) => void;
  payInstallment: (id: string) => void;
  removeCardInstallment: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => void;
  removeTransaction: (id: string) => void;
  addGoal: (goal: Omit<Goal, "id" | "createdAt">) => void;
  updateGoalAmount: (id: string, amount: number) => void;
  removeGoal: (id: string) => void;
  setSalaryConfig: (config: SalaryConfig) => void;
  clearSalaryConfig: () => void;
  addSalaryPayment: (payment: Omit<SalaryPayment, "id">) => void;
  removeSalaryPayment: (id: string) => void;
  addSubscription: (sub: Omit<Subscription, "id" | "createdAt">) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  removeSubscription: (id: string) => void;
}

const emptyData: ShapeData = {
  userProfile: null,
  transactions: [],
  goals: [],
  salaryConfig: null,
  salaryPayments: [],
  creditCards: [],
  cardInstallments: [],
  subscriptions: [],
};

function createId(): string {
  return crypto.randomUUID();
}

function snapshotData(state: ShapeStore): ShapeData {
  return {
    userProfile: state.userProfile,
    transactions: state.transactions,
    goals: state.goals,
    salaryConfig: state.salaryConfig,
    salaryPayments: state.salaryPayments,
    creditCards: state.creditCards,
    cardInstallments: state.cardInstallments,
    subscriptions: state.subscriptions,
  };
}

function commit(
  set: (partial: Partial<ShapeStore>) => void,
  get: () => ShapeStore,
  optimistic: Partial<ShapeStore>,
  write: (userId: string) => Promise<void>
) {
  const before = snapshotData(get());
  const userId = get().userId;
  if (!userId) {
    set({ syncError: "No hay una sesión activa." });
    return;
  }
  set({ ...optimistic, syncError: null });
  void write(userId).catch(async () => {
    try {
      const fresh = await loadAll(userId);
      set({ ...fresh, syncError: SYNC_ERROR });
    } catch {
      set({ ...before, syncError: SYNC_ERROR });
    }
  });
}

export const useShapeStore = create<ShapeStore>()((set, get) => ({
  ...emptyData,
  userId: null,
  authStatus: "loading",
  ready: false,
  syncError: null,
  importNotice: null,
  legacyPending: false,
  importingLegacy: false,

  beginSession: (userId) => set({ userId, authStatus: "authenticated", ready: false }),

  applyRemote: (data, notice, legacyPending) =>
    set({
      ...data,
      ready: true,
      authStatus: "authenticated",
      importNotice: notice,
      legacyPending,
      importingLegacy: false,
      syncError: null,
    }),

  failSession: (message) =>
    set({
      authStatus: "authenticated",
      ready: true,
      importingLegacy: false,
      syncError: message,
    }),

  resetSession: () =>
    set({
      ...emptyData,
      userId: null,
      authStatus: "anonymous",
      ready: true,
      syncError: null,
      importNotice: null,
      legacyPending: false,
      importingLegacy: false,
    }),

  dismissImportNotice: () => set({ importNotice: null }),
  dismissSyncError: () => set({ syncError: null }),

  setUserProfile: async (profile) => {
    const before = snapshotData(get());
    const userId = get().userId;
    if (!userId) {
      set({ syncError: "No hay una sesión activa." });
      throw new Error("No hay una sesión activa.");
    }
    set({ userProfile: profile, syncError: null });
    try {
      await updateProfile(userId, profile);
    } catch {
      set({ ...before, syncError: SYNC_ERROR });
      throw new Error(SYNC_ERROR);
    }
  },

  addCreditCard: (card) => {
    const full: CreditCard = { ...card, id: createId(), createdAt: new Date().toISOString() };
    commit(set, get, { creditCards: [full, ...get().creditCards] }, (userId) => insertCreditCard(userId, full));
  },

  updateCreditCard: (id, updates) => {
    const creditCards = get().creditCards.map((card) => (card.id === id ? { ...card, ...updates } : card));
    commit(set, get, { creditCards }, (userId) => updateCreditCardRow(userId, id, updates));
  },

  removeCreditCard: (id) => {
    commit(
      set,
      get,
      {
        creditCards: get().creditCards.filter((card) => card.id !== id),
        cardInstallments: get().cardInstallments.filter((installment) => installment.cardId !== id),
      },
      (userId) => deleteCreditCard(userId, id)
    );
  },

  addCardInstallment: (inst) => {
    const full: CardInstallment = { ...inst, id: createId() };
    commit(
      set,
      get,
      { cardInstallments: [full, ...get().cardInstallments] },
      (userId) => insertCardInstallment(userId, full)
    );
  },

  payInstallment: (id) => {
    const current = get().cardInstallments.find((installment) => installment.id === id);
    if (!current || current.paidInstallments >= current.totalInstallments) return;
    const paidInstallments = current.paidInstallments + 1;
    const cardInstallments = get().cardInstallments.map((installment) =>
      installment.id === id ? { ...installment, paidInstallments } : installment
    );
    commit(set, get, { cardInstallments }, (userId) => updateInstallmentPaid(userId, id, paidInstallments));
  },

  removeCardInstallment: (id) => {
    commit(
      set,
      get,
      { cardInstallments: get().cardInstallments.filter((installment) => installment.id !== id) },
      (userId) => deleteCardInstallment(userId, id)
    );
  },

  addTransaction: (tx) => {
    const full: Transaction = { ...tx, id: createId(), createdAt: new Date().toISOString() };
    commit(set, get, { transactions: [full, ...get().transactions] }, (userId) => insertTransaction(userId, full));
  },

  removeTransaction: (id) => {
    const tx = get().transactions.find((item) => item.id === id);
    if (!tx) return;
    commit(
      set,
      get,
      { transactions: get().transactions.filter((item) => item.id !== id) },
      (userId) => deleteTransaction(userId, tx)
    );
  },

  addGoal: (goal) => {
    const full: Goal = { ...goal, id: createId(), createdAt: new Date().toISOString() };
    commit(set, get, { goals: [full, ...get().goals] }, (userId) => insertGoal(userId, full));
  },

  updateGoalAmount: (id, amount) => {
    const goal = get().goals.find((item) => item.id === id);
    if (!goal) return;
    const currentAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
    const goals = get().goals.map((item) => (item.id === id ? { ...item, currentAmount } : item));
    commit(set, get, { goals }, (userId) => updateGoalCurrentAmount(userId, id, currentAmount));
  },

  removeGoal: (id) => {
    commit(set, get, { goals: get().goals.filter((goal) => goal.id !== id) }, (userId) => deleteGoal(userId, id));
  },

  setSalaryConfig: (config) => {
    commit(set, get, { salaryConfig: config }, (userId) => upsertSalaryConfig(userId, config));
  },

  clearSalaryConfig: () => {
    commit(set, get, { salaryConfig: null }, (userId) => deleteSalaryConfig(userId));
  },

  addSalaryPayment: (payment) => {
    const full: SalaryPayment = { ...payment, id: createId() };
    commit(
      set,
      get,
      { salaryPayments: [full, ...get().salaryPayments] },
      (userId) => insertSalaryPayment(userId, full)
    );
  },

  removeSalaryPayment: (id) => {
    commit(
      set,
      get,
      { salaryPayments: get().salaryPayments.filter((payment) => payment.id !== id) },
      (userId) => deleteSalaryPayment(userId, id)
    );
  },

  addSubscription: (sub) => {
    const full: Subscription = { ...sub, id: createId(), createdAt: new Date().toISOString() };
    commit(
      set,
      get,
      { subscriptions: [full, ...get().subscriptions] },
      (userId) => insertSubscription(userId, full)
    );
  },

  updateSubscription: (id, updates) => {
    const subscriptions = get().subscriptions.map((subscription) =>
      subscription.id === id ? { ...subscription, ...updates } : subscription
    );
    commit(set, get, { subscriptions }, (userId) => updateSubscriptionRow(userId, id, updates));
  },

  removeSubscription: (id) => {
    commit(
      set,
      get,
      { subscriptions: get().subscriptions.filter((subscription) => subscription.id !== id) },
      (userId) => deleteSubscription(userId, id)
    );
  },
}));

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
