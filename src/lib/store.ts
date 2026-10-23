"use client";

import { create } from "zustand";
import type { ShapeData } from "./db";
import { monthKey, todayISO } from "./dates";
import { adjustmentForTarget, buildMoneySnapshot, computeAccountBalance, isArs, roundMoney } from "./money";
import { planSalaryRegistration } from "./salary-utils";
import type {
  BalanceAdjustment,
  CardInstallment,
  CashAccount,
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
  insertAccount,
  insertBalanceAdjustment,
  insertCardInstallment,
  insertCreditCard,
  insertGoal,
  insertSalaryWithIncome,
  insertSubscription,
  insertTransaction,
  linkSalaryPair,
  loadAll,
  setIncomeCountsInBalance as setIncomeCountsInBalanceRow,
  updateAccount,
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
  addSalaryPayment: (payment: { amount: number; date: string; note?: string }) => void;
  removeSalaryPayment: (id: string) => void;
  linkSalaryIncome: (paymentId: string, incomeId: string) => void;
  attachSalaryIncome: (paymentId: string) => void;
  setIncomeCountsInBalance: (incomeId: string, counts: boolean) => void;
  saveAccount: (input: { name: string; startingBalance: number; startingDate: string }) => void;
  reconcileAccount: (targetBalance: number, note?: string) => void;
  localOnly: boolean;
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
  account: null,
  adjustments: [],
  ledgerReady: true,
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
    account: state.account,
    adjustments: state.adjustments,
    ledgerReady: state.ledgerReady,
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
  if (get().localOnly) return;
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
  localOnly: false,

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
      localOnly: false,
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
    const full: Transaction = {
      ...tx,
      id: createId(),
      createdAt: new Date().toISOString(),
      currency: tx.currency ?? "ARS",
      kind: tx.kind ?? "regular",
      source: tx.source ?? (tx.type === "expense" ? "manual" : undefined),
      countsInBalance: tx.countsInBalance !== false,
    };
    commit(set, get, { transactions: [full, ...get().transactions] }, (userId) => insertTransaction(userId, full));
  },

  removeTransaction: (id) => {
    const tx = get().transactions.find((item) => item.id === id);
    if (!tx) return;
    commit(
      set,
      get,
      {
        transactions: get().transactions.filter((item) => item.id !== id),
        salaryPayments: get().salaryPayments.filter(
          (payment) => payment.id !== tx.salaryPaymentId && payment.incomeId !== id
        ),
      },
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

  addSalaryPayment: ({ amount, date, note }) => {
    const state = get();
    const config = state.salaryConfig;
    if (!config) {
      set({ syncError: "Primero configurá el sueldo." });
      return;
    }
    if (!state.ledgerReady && !state.localOnly) {
      set({ syncError: "Falta correr la migración de saldos en Supabase." });
      return;
    }
    const plan = planSalaryRegistration(config, state.salaryPayments, date);
    if (!plan.ok) {
      set({ syncError: plan.reason });
      return;
    }
    const incomeId = createId();
    const paymentId = createId();
    const description = note?.trim() || config.label;
    const income: Transaction = {
      id: incomeId,
      type: "income",
      amount,
      description,
      category: "other",
      recurrence: "once",
      date,
      hasInstallments: false,
      createdAt: new Date().toISOString(),
      currency: "ARS",
      kind: "salary",
      countsInBalance: true,
      salaryPaymentId: paymentId,
    };
    const payment: SalaryPayment = {
      id: paymentId,
      amount,
      date,
      note: note?.trim() || undefined,
      incomeId,
      periodKey: plan.periodKey,
    };
    commit(
      set,
      get,
      {
        transactions: [income, ...state.transactions],
        salaryPayments: [payment, ...state.salaryPayments],
      },
      (userId) => insertSalaryWithIncome(userId, payment, income)
    );
  },

  removeSalaryPayment: (id) => {
    const payment = get().salaryPayments.find((item) => item.id === id);
    if (!payment) return;
    commit(
      set,
      get,
      {
        salaryPayments: get().salaryPayments.filter((item) => item.id !== id),
        transactions: get().transactions.filter(
          (tx) => tx.id !== payment.incomeId && tx.salaryPaymentId !== id
        ),
      },
      (userId) => deleteSalaryPayment(userId, id)
    );
  },

  linkSalaryIncome: (paymentId, incomeId) => {
    commit(
      set,
      get,
      {
        salaryPayments: get().salaryPayments.map((payment) =>
          payment.id === paymentId ? { ...payment, incomeId } : payment
        ),
        transactions: get().transactions.map((tx) =>
          tx.id === incomeId
            ? { ...tx, salaryPaymentId: paymentId, kind: "salary", countsInBalance: true }
            : tx
        ),
      },
      (userId) => linkSalaryPair(userId, paymentId, incomeId)
    );
  },

  attachSalaryIncome: (paymentId) => {
    const payment = get().salaryPayments.find((item) => item.id === paymentId);
    if (!payment || payment.incomeId) return;
    const incomeId = createId();
    const income: Transaction = {
      id: incomeId,
      type: "income",
      amount: payment.amount,
      description: payment.note?.trim() || get().salaryConfig?.label || "Sueldo",
      category: "other",
      recurrence: "once",
      date: payment.date,
      hasInstallments: false,
      createdAt: new Date().toISOString(),
      currency: "ARS",
      kind: "salary",
      countsInBalance: true,
      salaryPaymentId: paymentId,
    };
    commit(
      set,
      get,
      {
        transactions: [income, ...get().transactions],
        salaryPayments: get().salaryPayments.map((item) =>
          item.id === paymentId ? { ...item, incomeId } : item
        ),
      },
      async (userId) => {
        await insertTransaction(userId, { ...income, salaryPaymentId: undefined });
        try {
          await linkSalaryPair(userId, paymentId, incomeId);
        } catch (error) {
          await deleteTransaction(userId, income).catch(() => undefined);
          throw error;
        }
      }
    );
  },

  setIncomeCountsInBalance: (incomeId, counts) => {
    const tx = get().transactions.find((item) => item.id === incomeId);
    if (!tx || tx.type !== "income") return;
    commit(
      set,
      get,
      {
        transactions: get().transactions.map((item) =>
          item.id === incomeId ? { ...item, countsInBalance: counts } : item
        ),
      },
      (userId) => setIncomeCountsInBalanceRow(userId, incomeId, counts)
    );
  },

  saveAccount: ({ name, startingBalance, startingDate }) => {
    if (!get().ledgerReady && !get().localOnly) {
      set({ syncError: "Falta correr la migración de saldos en Supabase." });
      return;
    }
    const current = get().account;
    const next: CashAccount = {
      id: current?.id ?? createId(),
      name: name.trim() || "Mercado Pago",
      currency: "ARS",
      startingBalance,
      startingDate,
    };
    commit(
      set,
      get,
      { account: next },
      (userId) =>
        current
          ? updateAccount(userId, current.id, {
              name: next.name,
              startingBalance,
              startingDate,
            })
          : insertAccount(userId, next)
    );
  },

  reconcileAccount: (targetBalance, note) => {
    const state = get();
    if (!state.account) {
      set({ syncError: "Primero cargá el saldo inicial." });
      return;
    }
    const today = todayISO();
    const current = computeAccountBalance(
      { startingBalance: state.account.startingBalance, startingDate: state.account.startingDate },
      state.transactions,
      state.adjustments,
      today
    );
    const delta = adjustmentForTarget(current.balance, targetBalance);
    if (delta == null) {
      set({ syncError: "El saldo calculado ya coincide con el que escribiste." });
      return;
    }
    const adjustment: BalanceAdjustment = {
      id: createId(),
      accountId: state.account.id,
      amount: delta,
      date: today,
      note: note?.trim() || "Ajuste al saldo real",
      balanceBefore: current.balance,
      balanceAfter: roundMoney(current.balance + delta),
      createdAt: new Date().toISOString(),
    };
    commit(
      set,
      get,
      { adjustments: [adjustment, ...state.adjustments] },
      (userId) => insertBalanceAdjustment(userId, adjustment)
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
  const adjustments = useShapeStore((s) => s.adjustments);
  const account = useShapeStore((s) => s.account);
  const salaryConfig = useShapeStore((s) => s.salaryConfig);
  const salaryPayments = useShapeStore((s) => s.salaryPayments);
  const snapshot = buildMoneySnapshot({
    account: account
      ? { startingBalance: account.startingBalance, startingDate: account.startingDate }
      : null,
    transactions,
    adjustments,
    salaryConfig,
    salaryPayments,
  });

  const totalIncome = snapshot.allTimeArs.income;
  const totalExpenses = snapshot.allTimeArs.expense;
  const balance = snapshot.account.hasBaseline
    ? snapshot.account.balance
    : roundMoney(totalIncome - totalExpenses);
  const monthlyData = buildMonthlyData(transactions);
  const categoryData = buildCategoryData(transactions);

  return { totalIncome, totalExpenses, balance, monthlyData, categoryData, snapshot };
}

function buildMonthlyData(transactions: Transaction[]) {
  const months: Record<string, { income: number; expenses: number }> = {};

  transactions.forEach((t) => {
    if (!isArs(t.currency) || t.countsInBalance === false) return;
    const key = monthKey(t.date);
    if (!key) return;
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
    .filter((t) => t.type === "expense" && isArs(t.currency) && t.countsInBalance !== false)
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
