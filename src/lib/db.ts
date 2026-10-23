import { normalizeCurrency } from "./money";
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
import type { LegacySnapshot } from "./legacy-snapshot";
import { isExpenseCategory, isRecurrence } from "./legacy-snapshot";
import { getSupabase } from "./supabase/client";

export interface ShapeData {
  userProfile: UserProfile | null;
  transactions: Transaction[];
  goals: Goal[];
  salaryConfig: SalaryConfig | null;
  salaryPayments: SalaryPayment[];
  creditCards: CreditCard[];
  cardInstallments: CardInstallment[];
  subscriptions: Subscription[];
  account: CashAccount | null;
  adjustments: BalanceAdjustment[];
  /** false si todavía no corriste la migración de saldo real. */
  ledgerReady: boolean;
}

type Row = Record<string, unknown>;

function assertNoError(error: { message: string; code?: string } | null): void {
  if (!error) return;
  if (isMissingSchema(error)) {
    throw new Error("Falta correr la migración de saldos en el SQL Editor de Supabase.");
  }
  throw new Error(error.message);
}

function isMissingSchema(error: { message: string; code?: string }): boolean {
  const code = error.code ?? "";
  return code === "42P01" || code === "PGRST205" || /does not exist|schema cache|could not find the table/i.test(error.message);
}

function asRows(data: unknown): Row[] {
  if (!Array.isArray(data)) return [];
  return data.filter((row): row is Row => Boolean(row) && typeof row === "object");
}

function str(row: Row, key: string, fallback = ""): string {
  const value = row[key];
  return typeof value === "string" ? value : fallback;
}

function num(row: Row, key: string, fallback = 0): number {
  const value = row[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function bool(row: Row, key: string, fallback = false): boolean {
  const value = row[key];
  return typeof value === "boolean" ? value : fallback;
}

function optionalStr(row: Row, key: string): string | undefined {
  const value = str(row, key).trim();
  return value ? value : undefined;
}

function mapProfile(row: Row | null): UserProfile | null {
  if (!row) return null;
  const name = str(row, "name").trim();
  const avatar = optionalStr(row, "avatar") ?? null;
  if (!name && !avatar) return null;
  return { name: name || "Perfil", avatar };
}

function mapExpense(row: Row): Transaction {
  const category = str(row, "category");
  const recurrence = str(row, "recurrence");
  const hasInstallments = bool(row, "has_installments");
  const merchant = optionalStr(row, "merchant");
  return {
    id: str(row, "id"),
    type: "expense",
    amount: num(row, "amount"),
    description: str(row, "description").trim() || merchant || "Gasto",
    category: isExpenseCategory(category) ? category : "other",
    recurrence: isRecurrence(recurrence) ? recurrence : "once",
    date: str(row, "date").slice(0, 10),
    hasInstallments,
    totalInstallments: hasInstallments ? num(row, "total_installments") || undefined : undefined,
    currentInstallment: hasInstallments ? num(row, "current_installment") || undefined : undefined,
    cardName: hasInstallments ? optionalStr(row, "card_name") : undefined,
    createdAt: str(row, "created_at"),
    currency: normalizeCurrency(optionalStr(row, "currency")),
    merchant,
    source: optionalStr(row, "source"),
    kind: "regular",
    countsInBalance: true,
  };
}

function mapIncome(row: Row): Transaction {
  const category = str(row, "category");
  const recurrence = str(row, "recurrence");
  const kind = str(row, "kind");
  return {
    id: str(row, "id"),
    type: "income",
    amount: num(row, "amount"),
    description: str(row, "description").trim() || "Ingreso",
    category: isExpenseCategory(category) ? category : "other",
    recurrence: isRecurrence(recurrence) ? recurrence : "once",
    date: str(row, "date").slice(0, 10),
    hasInstallments: false,
    createdAt: str(row, "created_at"),
    currency: normalizeCurrency(optionalStr(row, "currency")),
    kind: kind === "salary" ? "salary" : "regular",
    countsInBalance: row.counts_in_balance == null ? true : bool(row, "counts_in_balance", true),
    salaryPaymentId: optionalStr(row, "salary_payment_id"),
  };
}

function mapGoal(row: Row): Goal {
  return {
    id: str(row, "id"),
    name: str(row, "name"),
    targetAmount: num(row, "target_amount"),
    currentAmount: num(row, "current_amount"),
    deadline: optionalStr(row, "deadline"),
    emoji: optionalStr(row, "emoji"),
    createdAt: str(row, "created_at"),
  };
}

function mapSalary(row: Row | null): SalaryConfig | null {
  if (!row) return null;
  const frequency = str(row, "frequency");
  if (frequency !== "monthly" && frequency !== "biweekly" && frequency !== "weekly") return null;
  const payDay2 = row.pay_day_2 == null || row.pay_day_2 === "" ? undefined : num(row, "pay_day_2");
  return {
    amount: num(row, "amount"),
    frequency,
    payDay: num(row, "pay_day"),
    payDay2,
    label: str(row, "label") || "Mi sueldo",
  };
}

function mapPayment(row: Row): SalaryPayment {
  return {
    id: str(row, "id"),
    amount: num(row, "amount"),
    date: str(row, "date").slice(0, 10),
    note: optionalStr(row, "note"),
    incomeId: optionalStr(row, "income_id"),
    periodKey: optionalStr(row, "period_key"),
  };
}

function mapAccount(row: Row | null): CashAccount | null {
  if (!row || !str(row, "id")) return null;
  return {
    id: str(row, "id"),
    name: str(row, "name").trim() || "Mercado Pago",
    currency: "ARS",
    startingBalance: num(row, "starting_balance"),
    startingDate: str(row, "starting_date").slice(0, 10),
  };
}

function mapAdjustment(row: Row): BalanceAdjustment {
  return {
    id: str(row, "id"),
    accountId: str(row, "account_id"),
    amount: num(row, "amount"),
    date: str(row, "date").slice(0, 10),
    note: optionalStr(row, "note"),
    balanceBefore: num(row, "balance_before"),
    balanceAfter: num(row, "balance_after"),
    createdAt: str(row, "created_at"),
  };
}

function mapCard(row: Row): CreditCard {
  const network = str(row, "network");
  return {
    id: str(row, "id"),
    label: str(row, "label"),
    network: network === "mastercard" || network === "amex" ? network : "visa",
    issuerKey: str(row, "issuer_key") || "otro",
    creditLimit: num(row, "credit_limit"),
    usedAmount: num(row, "used_amount"),
    lastFourDigits: optionalStr(row, "last_four_digits"),
    color: optionalStr(row, "color"),
    createdAt: str(row, "created_at"),
  };
}

function mapInstallment(row: Row): CardInstallment {
  return {
    id: str(row, "id"),
    cardId: str(row, "card_id"),
    description: str(row, "description"),
    totalAmount: num(row, "total_amount"),
    totalInstallments: num(row, "total_installments"),
    paidInstallments: num(row, "paid_installments"),
    startDate: str(row, "start_date").slice(0, 10),
  };
}

function mapSubscription(row: Row): Subscription {
  const currency = str(row, "currency");
  const period = str(row, "period");
  const category = str(row, "category");
  return {
    id: str(row, "id"),
    name: str(row, "name"),
    domain: str(row, "domain"),
    price: num(row, "price"),
    currency: currency === "USD" ? "USD" : "ARS",
    period: period === "yearly" || period === "weekly" ? period : "monthly",
    startDate: str(row, "start_date").slice(0, 10),
    active: bool(row, "active", true),
    category:
      category === "streaming" ||
      category === "productivity" ||
      category === "food" ||
      category === "music" ||
      category === "storage" ||
      category === "gaming"
        ? category
        : "other",
    createdAt: str(row, "created_at"),
  };
}

export async function loadAll(userId: string): Promise<ShapeData> {
  const supabase = getSupabase();
  const [
    profileRes,
    expensesRes,
    incomesRes,
    goalsRes,
    salaryRes,
    paymentsRes,
    cardsRes,
    installmentsRes,
    subscriptionsRes,
    accountRes,
    adjustmentsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("expenses").select("*").eq("user_id", userId),
    supabase.from("incomes").select("*").eq("user_id", userId),
    supabase.from("goals").select("*").eq("user_id", userId),
    supabase.from("salary_configs").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("salary_payments").select("*").eq("user_id", userId),
    supabase.from("credit_cards").select("*").eq("user_id", userId),
    supabase.from("card_installments").select("*").eq("user_id", userId),
    supabase.from("subscriptions").select("*").eq("user_id", userId),
    supabase.from("accounts").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("balance_adjustments").select("*").eq("user_id", userId),
  ]);

  for (const result of [
    profileRes,
    expensesRes,
    incomesRes,
    goalsRes,
    salaryRes,
    paymentsRes,
    cardsRes,
    installmentsRes,
    subscriptionsRes,
  ]) {
    assertNoError(result.error);
  }

  const ledgerMissing = [accountRes.error, adjustmentsRes.error].some(
    (error) => error && isMissingSchema(error)
  );
  if (!ledgerMissing) {
    assertNoError(accountRes.error);
    assertNoError(adjustmentsRes.error);
  }

  const transactions = [
    ...asRows(expensesRes.data).map(mapExpense),
    ...asRows(incomesRes.data).map(mapIncome),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.date.localeCompare(a.date));

  return {
    userProfile: mapProfile((profileRes.data as Row | null) ?? null),
    transactions,
    goals: asRows(goalsRes.data).map(mapGoal),
    salaryConfig: mapSalary((salaryRes.data as Row | null) ?? null),
    salaryPayments: asRows(paymentsRes.data).map(mapPayment),
    account: ledgerMissing ? null : mapAccount((accountRes.data as Row | null) ?? null),
    adjustments: ledgerMissing ? [] : asRows(adjustmentsRes.data).map(mapAdjustment),
    ledgerReady: !ledgerMissing,
    creditCards: asRows(cardsRes.data).map(mapCard),
    cardInstallments: asRows(installmentsRes.data).map(mapInstallment),
    subscriptions: asRows(subscriptionsRes.data).map(mapSubscription),
  };
}

export async function updateProfile(userId: string, profile: UserProfile): Promise<void> {
  const { error } = await getSupabase()
    .from("profiles")
    .update({ name: profile.name, avatar: profile.avatar })
    .eq("id", userId);
  assertNoError(error);
}

export async function insertTransaction(userId: string, tx: Transaction): Promise<void> {
  if (tx.type === "expense") {
    const { error } = await getSupabase().from("expenses").insert({
      id: tx.id,
      user_id: userId,
      amount: tx.amount,
      currency: normalizeCurrency(tx.currency),
      date: tx.date,
      description: tx.description,
      merchant: tx.merchant ?? null,
      category: tx.category,
      source: tx.source ?? "manual",
      recurrence: tx.recurrence,
      has_installments: tx.hasInstallments,
      total_installments: tx.totalInstallments ?? null,
      current_installment: tx.currentInstallment ?? null,
      card_name: tx.cardName ?? null,
      created_at: tx.createdAt,
    });
    assertNoError(error);
    return;
  }

  const { error } = await getSupabase().from("incomes").insert({
    id: tx.id,
    user_id: userId,
    amount: tx.amount,
    currency: normalizeCurrency(tx.currency),
    date: tx.date,
    description: tx.description,
    category: tx.category,
    recurrence: tx.recurrence,
    kind: tx.kind === "salary" ? "salary" : "regular",
    counts_in_balance: tx.countsInBalance !== false,
    salary_payment_id: tx.salaryPaymentId ?? null,
    created_at: tx.createdAt,
  });
  assertNoError(error);
}

export async function deleteTransaction(userId: string, tx: Transaction): Promise<void> {
  const table = tx.type === "expense" ? "expenses" : "incomes";
  const { error } = await getSupabase().from(table).delete().eq("id", tx.id).eq("user_id", userId);
  assertNoError(error);
}

export async function insertGoal(userId: string, goal: Goal): Promise<void> {
  const { error } = await getSupabase().from("goals").insert({
    id: goal.id,
    user_id: userId,
    name: goal.name,
    target_amount: goal.targetAmount,
    current_amount: goal.currentAmount,
    deadline: goal.deadline ?? null,
    emoji: goal.emoji ?? null,
    created_at: goal.createdAt,
  });
  assertNoError(error);
}

export async function updateGoalCurrentAmount(userId: string, id: string, currentAmount: number): Promise<void> {
  const { error } = await getSupabase()
    .from("goals")
    .update({ current_amount: currentAmount })
    .eq("id", id)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function deleteGoal(userId: string, id: string): Promise<void> {
  const { error } = await getSupabase().from("goals").delete().eq("id", id).eq("user_id", userId);
  assertNoError(error);
}

export async function upsertSalaryConfig(userId: string, config: SalaryConfig): Promise<void> {
  const { error } = await getSupabase().from("salary_configs").upsert(
    {
      user_id: userId,
      amount: config.amount,
      currency: "ARS",
      frequency: config.frequency,
      pay_day: config.payDay,
      pay_day_2: config.payDay2 ?? null,
      label: config.label,
    },
    { onConflict: "user_id" }
  );
  assertNoError(error);
}

export async function deleteSalaryConfig(userId: string): Promise<void> {
  const { error } = await getSupabase().from("salary_configs").delete().eq("user_id", userId);
  assertNoError(error);
}

export async function insertSalaryPayment(userId: string, payment: SalaryPayment): Promise<void> {
  const { error } = await getSupabase().from("salary_payments").insert({
    id: payment.id,
    user_id: userId,
    amount: payment.amount,
    date: payment.date,
    note: payment.note ?? null,
    income_id: payment.incomeId ?? null,
    period_key: payment.periodKey ?? null,
  });
  if (error?.code === "23505") {
    throw new Error("Ya registraste un cobro para este período.");
  }
  assertNoError(error);
}

export async function insertSalaryWithIncome(
  userId: string,
  payment: SalaryPayment,
  income: Transaction
): Promise<void> {
  await insertTransaction(userId, { ...income, salaryPaymentId: undefined });
  try {
    await insertSalaryPayment(userId, payment);
  } catch (error) {
    await deleteTransaction(userId, income).catch(() => undefined);
    throw error;
  }
  const { error } = await getSupabase()
    .from("incomes")
    .update({ salary_payment_id: payment.id, kind: "salary" })
    .eq("id", income.id)
    .eq("user_id", userId);
  if (error) {
    await deleteSalaryPayment(userId, payment.id).catch(() => undefined);
    await deleteTransaction(userId, income).catch(() => undefined);
    assertNoError(error);
  }
}

export async function linkSalaryPair(userId: string, paymentId: string, incomeId: string): Promise<void> {
  const { error: paymentError } = await getSupabase()
    .from("salary_payments")
    .update({ income_id: incomeId })
    .eq("id", paymentId)
    .eq("user_id", userId);
  assertNoError(paymentError);
  const { error } = await getSupabase()
    .from("incomes")
    .update({ salary_payment_id: paymentId, kind: "salary", counts_in_balance: true })
    .eq("id", incomeId)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function setIncomeCountsInBalance(userId: string, id: string, counts: boolean): Promise<void> {
  const { error } = await getSupabase()
    .from("incomes")
    .update({ counts_in_balance: counts })
    .eq("id", id)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function insertAccount(
  userId: string,
  account: { id: string; name: string; startingBalance: number; startingDate: string }
): Promise<void> {
  const { error } = await getSupabase().from("accounts").insert({
    id: account.id,
    user_id: userId,
    name: account.name,
    currency: "ARS",
    starting_balance: account.startingBalance,
    starting_date: account.startingDate,
  });
  assertNoError(error);
}

export async function updateAccount(
  userId: string,
  id: string,
  account: { name: string; startingBalance: number; startingDate: string }
): Promise<void> {
  const { error } = await getSupabase()
    .from("accounts")
    .update({
      name: account.name,
      starting_balance: account.startingBalance,
      starting_date: account.startingDate,
    })
    .eq("id", id)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function insertBalanceAdjustment(userId: string, adjustment: BalanceAdjustment): Promise<void> {
  const { error } = await getSupabase().from("balance_adjustments").insert({
    id: adjustment.id,
    user_id: userId,
    account_id: adjustment.accountId,
    amount: adjustment.amount.toFixed(2),
    date: adjustment.date,
    note: adjustment.note ?? null,
    balance_before: adjustment.balanceBefore.toFixed(2),
    balance_after: adjustment.balanceAfter.toFixed(2),
    created_at: adjustment.createdAt,
  });
  assertNoError(error);
}

export async function deleteSalaryPayment(userId: string, id: string): Promise<void> {
  const { error } = await getSupabase().from("salary_payments").delete().eq("id", id).eq("user_id", userId);
  assertNoError(error);
}

export async function insertCreditCard(userId: string, card: CreditCard): Promise<void> {
  const { error } = await getSupabase().from("credit_cards").insert({
    id: card.id,
    user_id: userId,
    label: card.label,
    network: card.network,
    issuer_key: card.issuerKey,
    credit_limit: card.creditLimit,
    used_amount: card.usedAmount,
    last_four_digits: card.lastFourDigits ?? null,
    color: card.color ?? null,
    created_at: card.createdAt,
  });
  assertNoError(error);
}

export async function updateCreditCard(userId: string, id: string, updates: Partial<CreditCard>): Promise<void> {
  const patch: Row = {};
  if (updates.label !== undefined) patch.label = updates.label;
  if (updates.network !== undefined) patch.network = updates.network;
  if (updates.issuerKey !== undefined) patch.issuer_key = updates.issuerKey;
  if (updates.creditLimit !== undefined) patch.credit_limit = updates.creditLimit;
  if (updates.usedAmount !== undefined) patch.used_amount = updates.usedAmount;
  if (updates.lastFourDigits !== undefined) patch.last_four_digits = updates.lastFourDigits;
  if (updates.color !== undefined) patch.color = updates.color;
  const { error } = await getSupabase().from("credit_cards").update(patch).eq("id", id).eq("user_id", userId);
  assertNoError(error);
}

export async function deleteCreditCard(userId: string, id: string): Promise<void> {
  const { error } = await getSupabase().from("credit_cards").delete().eq("id", id).eq("user_id", userId);
  assertNoError(error);
}

export async function insertCardInstallment(userId: string, installment: CardInstallment): Promise<void> {
  const { error } = await getSupabase().from("card_installments").insert({
    id: installment.id,
    user_id: userId,
    card_id: installment.cardId,
    description: installment.description,
    total_amount: installment.totalAmount,
    total_installments: installment.totalInstallments,
    paid_installments: installment.paidInstallments,
    start_date: installment.startDate,
  });
  assertNoError(error);
}

export async function updateInstallmentPaid(userId: string, id: string, paidInstallments: number): Promise<void> {
  const { error } = await getSupabase()
    .from("card_installments")
    .update({ paid_installments: paidInstallments })
    .eq("id", id)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function deleteCardInstallment(userId: string, id: string): Promise<void> {
  const { error } = await getSupabase().from("card_installments").delete().eq("id", id).eq("user_id", userId);
  assertNoError(error);
}

export async function insertSubscription(userId: string, subscription: Subscription): Promise<void> {
  const { error } = await getSupabase().from("subscriptions").insert({
    id: subscription.id,
    user_id: userId,
    name: subscription.name,
    domain: subscription.domain,
    price: subscription.price,
    currency: subscription.currency,
    period: subscription.period,
    start_date: subscription.startDate,
    active: subscription.active,
    category: subscription.category,
    created_at: subscription.createdAt,
  });
  assertNoError(error);
}

export async function updateSubscriptionRow(
  userId: string,
  id: string,
  updates: Partial<Subscription>
): Promise<void> {
  const patch: Row = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.domain !== undefined) patch.domain = updates.domain;
  if (updates.price !== undefined) patch.price = updates.price;
  if (updates.currency !== undefined) patch.currency = updates.currency;
  if (updates.period !== undefined) patch.period = updates.period;
  if (updates.startDate !== undefined) patch.start_date = updates.startDate;
  if (updates.active !== undefined) patch.active = updates.active;
  if (updates.category !== undefined) patch.category = updates.category;
  const { error } = await getSupabase().from("subscriptions").update(patch).eq("id", id).eq("user_id", userId);
  assertNoError(error);
}

export async function deleteSubscription(userId: string, id: string): Promise<void> {
  const { error } = await getSupabase().from("subscriptions").delete().eq("id", id).eq("user_id", userId);
  assertNoError(error);
}

async function upsertLegacy(
  table: string,
  rows: Row[],
  onConflict: string
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await getSupabase()
    .from(table)
    .upsert(rows, { onConflict, ignoreDuplicates: true, defaultToNull: false });
  assertNoError(error);
}

export async function importSnapshot(userId: string, snapshot: LegacySnapshot): Promise<void> {
  const supabase = getSupabase();

  await upsertLegacy(
    "credit_cards",
    snapshot.creditCards.map((card) => ({
      user_id: userId,
      legacy_id: card.id,
      label: card.label,
      network: card.network,
      issuer_key: card.issuerKey,
      credit_limit: card.creditLimit,
      used_amount: card.usedAmount,
      last_four_digits: card.lastFourDigits ?? null,
      color: card.color ?? null,
      created_at: card.createdAt,
    })),
    "user_id,legacy_id"
  );

  const legacyCardIds = snapshot.creditCards.map((card) => card.id);
  const cardIdByLegacy = new Map<string, string>();
  if (legacyCardIds.length > 0) {
    const { data, error } = await supabase
      .from("credit_cards")
      .select("id, legacy_id")
      .eq("user_id", userId)
      .in("legacy_id", legacyCardIds);
    assertNoError(error);
    for (const row of asRows(data)) {
      const legacyId = str(row, "legacy_id");
      const id = str(row, "id");
      if (legacyId && id) cardIdByLegacy.set(legacyId, id);
    }
  }

  await upsertLegacy(
    "card_installments",
    snapshot.cardInstallments.flatMap((installment) => {
      const cardId = cardIdByLegacy.get(installment.cardId);
      if (!cardId) return [];
      return [
        {
          user_id: userId,
          card_id: cardId,
          legacy_id: installment.id,
          description: installment.description,
          total_amount: installment.totalAmount,
          total_installments: installment.totalInstallments,
          paid_installments: installment.paidInstallments,
          start_date: installment.startDate,
        },
      ];
    }),
    "user_id,legacy_id"
  );

  await upsertLegacy(
    "expenses",
    snapshot.transactions
      .filter((tx) => tx.type === "expense")
      .map((tx) => ({
        user_id: userId,
        legacy_id: tx.id,
        amount: tx.amount,
        currency: "ARS",
        date: tx.date,
        description: tx.description,
        category: tx.category,
        source: "manual",
        recurrence: tx.recurrence,
        has_installments: tx.hasInstallments,
        total_installments: tx.totalInstallments ?? null,
        current_installment: tx.currentInstallment ?? null,
        card_name: tx.cardName ?? null,
        created_at: tx.createdAt,
      })),
    "user_id,legacy_id"
  );

  await upsertLegacy(
    "incomes",
    snapshot.transactions
      .filter((tx) => tx.type === "income")
      .map((tx) => ({
        user_id: userId,
        legacy_id: tx.id,
        amount: tx.amount,
        currency: "ARS",
        date: tx.date,
        description: tx.description,
        category: tx.category,
        recurrence: tx.recurrence,
        created_at: tx.createdAt,
      })),
    "user_id,legacy_id"
  );

  await upsertLegacy(
    "goals",
    snapshot.goals.map((goal) => ({
      user_id: userId,
      legacy_id: goal.id,
      name: goal.name,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      deadline: goal.deadline ?? null,
      emoji: goal.emoji ?? null,
      created_at: goal.createdAt,
    })),
    "user_id,legacy_id"
  );

  await upsertLegacy(
    "salary_payments",
    snapshot.salaryPayments.map((payment) => ({
      user_id: userId,
      legacy_id: payment.id,
      amount: payment.amount,
      date: payment.date,
      note: payment.note ?? null,
    })),
    "user_id,legacy_id"
  );

  if (snapshot.salaryConfig) {
    const { error } = await supabase.from("salary_configs").upsert(
      {
        user_id: userId,
        amount: snapshot.salaryConfig.amount,
        currency: "ARS",
        frequency: snapshot.salaryConfig.frequency,
        pay_day: snapshot.salaryConfig.payDay,
        pay_day_2: snapshot.salaryConfig.payDay2 ?? null,
        label: snapshot.salaryConfig.label,
      },
      { onConflict: "user_id", ignoreDuplicates: true, defaultToNull: false }
    );
    assertNoError(error);
  }

  await upsertLegacy(
    "subscriptions",
    snapshot.subscriptions.map((subscription) => ({
      user_id: userId,
      legacy_id: subscription.id,
      name: subscription.name,
      domain: subscription.domain,
      price: subscription.price,
      currency: subscription.currency,
      period: subscription.period,
      start_date: subscription.startDate,
      active: subscription.active,
      category: subscription.category,
      created_at: subscription.createdAt,
    })),
    "user_id,legacy_id"
  );

  if (snapshot.userProfile) {
    try {
      const { data, error } = await supabase.from("profiles").select("name, avatar").eq("id", userId).maybeSingle();
      assertNoError(error);
      const current = (data as Row | null) ?? null;
      const name = current ? str(current, "name").trim() : "";
      const avatar = current ? optionalStr(current, "avatar") ?? null : null;
      const patch: { name?: string; avatar?: string | null } = {};
      if (!name && snapshot.userProfile.name) patch.name = snapshot.userProfile.name;
      if (!avatar && snapshot.userProfile.avatar) patch.avatar = snapshot.userProfile.avatar;
      if (Object.keys(patch).length > 0) {
        const { error: updateError } = await supabase.from("profiles").update(patch).eq("id", userId);
        assertNoError(updateError);
      }
    } catch {
      // El perfil es secundario: los movimientos ya quedaron guardados.
    }
  }
}
