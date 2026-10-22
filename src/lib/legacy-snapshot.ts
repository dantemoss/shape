import type {
  CardInstallment,
  CardNetwork,
  CreditCard,
  ExpenseCategory,
  Goal,
  RecurrenceType,
  SalaryConfig,
  SalaryFrequency,
  SalaryPayment,
  SubCategory,
  SubCurrency,
  SubPeriod,
  Subscription,
  Transaction,
  UserProfile,
} from "./types";

export const LEGACY_STORAGE_KEY = "shape-storage";

export function legacyImportedFlag(userId: string): string {
  return `shape-legacy-imported:${userId}`;
}

export interface LegacySnapshot {
  userProfile: UserProfile | null;
  transactions: Transaction[];
  goals: Goal[];
  salaryConfig: SalaryConfig | null;
  salaryPayments: SalaryPayment[];
  creditCards: CreditCard[];
  cardInstallments: CardInstallment[];
  subscriptions: Subscription[];
}

const EXPENSE_CATEGORIES = new Set<ExpenseCategory>([
  "housing",
  "food",
  "transport",
  "entertainment",
  "health",
  "education",
  "subscriptions",
  "clothing",
  "savings",
  "other",
]);

const RECURRENCES = new Set<RecurrenceType>(["once", "monthly", "weekly", "yearly"]);
const SALARY_FREQUENCIES = new Set<SalaryFrequency>(["monthly", "biweekly", "weekly"]);
const CARD_NETWORKS = new Set<CardNetwork>(["visa", "mastercard", "amex"]);
const SUB_CURRENCIES = new Set<SubCurrency>(["ARS", "USD"]);
const SUB_PERIODS = new Set<SubPeriod>(["monthly", "yearly", "weekly"]);
const SUB_CATEGORIES = new Set<SubCategory>([
  "streaming",
  "productivity",
  "food",
  "music",
  "storage",
  "gaming",
  "other",
]);

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return EXPENSE_CATEGORIES.has(value as ExpenseCategory);
}

export function isRecurrence(value: string): value is RecurrenceType {
  return RECURRENCES.has(value as RecurrenceType);
}

export function parseLegacySnapshot(raw: string): LegacySnapshot | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const state = unwrapState(parsed);
    if (!state) return null;
    return normalizeState(state);
  } catch {
    return null;
  }
}

export function legacyHasData(snapshot: LegacySnapshot): boolean {
  return Boolean(
    snapshot.userProfile ||
      snapshot.transactions.length ||
      snapshot.goals.length ||
      snapshot.salaryConfig ||
      snapshot.salaryPayments.length ||
      snapshot.creditCards.length ||
      snapshot.cardInstallments.length ||
      snapshot.subscriptions.length
  );
}

export function summarizeLegacy(snapshot: LegacySnapshot): string {
  const parts: string[] = [];
  pushCount(parts, snapshot.transactions.length, "movimiento", "movimientos");
  pushCount(parts, snapshot.goals.length, "meta", "metas");
  if (snapshot.salaryConfig) parts.push("tu sueldo");
  pushCount(parts, snapshot.salaryPayments.length, "cobro", "cobros");
  pushCount(parts, snapshot.creditCards.length, "tarjeta", "tarjetas");
  pushCount(parts, snapshot.cardInstallments.length, "plan de cuotas", "planes de cuotas");
  pushCount(parts, snapshot.subscriptions.length, "suscripción", "suscripciones");
  if (parts.length === 0 && snapshot.userProfile) parts.push("tu perfil");
  if (parts.length === 0) return "No había datos financieros para importar.";
  return `Importamos ${joinSpanish(parts)}.`;
}

function pushCount(parts: string[], count: number, singular: string, plural: string) {
  if (count === 1) parts.push(`1 ${singular}`);
  else if (count > 1) parts.push(`${count} ${plural}`);
}

function joinSpanish(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
}

function unwrapState(parsed: unknown): Record<string, unknown> | null {
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Record<string, unknown>;
  if (record.state && typeof record.state === "object") {
    return record.state as Record<string, unknown>;
  }
  if (
    "transactions" in record ||
    "goals" in record ||
    "userProfile" in record ||
    "creditCards" in record ||
    "subscriptions" in record ||
    "salaryConfig" in record
  ) {
    return record;
  }
  return null;
}

function normalizeState(state: Record<string, unknown>): LegacySnapshot {
  const creditCards = asArray(state.creditCards).map(normalizeCard).filter(isPresent);
  const cardIds = new Set(creditCards.map((card) => card.id));

  return {
    userProfile: normalizeProfile(state.userProfile),
    transactions: asArray(state.transactions).map(normalizeTransaction).filter(isPresent),
    goals: asArray(state.goals).map(normalizeGoal).filter(isPresent),
    salaryConfig: normalizeSalaryConfig(state.salaryConfig),
    salaryPayments: asArray(state.salaryPayments).map(normalizeSalaryPayment).filter(isPresent),
    creditCards,
    cardInstallments: asArray(state.cardInstallments)
      .map(normalizeInstallment)
      .filter(isPresent)
      .filter((installment) => cardIds.has(installment.cardId)),
    subscriptions: asArray(state.subscriptions).map(normalizeSubscription).filter(isPresent),
  };
}

function normalizeProfile(value: unknown): UserProfile | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const name = readString(record.name).trim();
  const avatar = readString(record.avatar) || null;
  if (!name && !avatar) return null;
  return { name, avatar };
}

function normalizeTransaction(value: unknown): Transaction | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = readString(record.id);
  const type = record.type === "income" || record.type === "expense" ? record.type : null;
  const amount = readPositive(record.amount);
  const date = readDate(record.date);
  if (!id || !type || amount === null || !date) return null;

  const categoryRaw = readString(record.category);
  const recurrenceRaw = readString(record.recurrence);
  const hasInstallments = type === "expense" && record.hasInstallments === true;
  const totalInstallments = readPositiveInt(record.totalInstallments);
  const currentInstallment = readPositiveInt(record.currentInstallment);

  return {
    id,
    type,
    amount,
    description: readString(record.description) || (type === "income" ? "Ingreso" : "Gasto"),
    category: isExpenseCategory(categoryRaw) ? categoryRaw : "other",
    recurrence: isRecurrence(recurrenceRaw) ? recurrenceRaw : "once",
    date,
    hasInstallments,
    totalInstallments: hasInstallments ? totalInstallments ?? undefined : undefined,
    currentInstallment: hasInstallments ? currentInstallment ?? undefined : undefined,
    cardName: hasInstallments ? readString(record.cardName) || undefined : undefined,
    createdAt: readTimestamp(record.createdAt, date),
  };
}

function normalizeGoal(value: unknown): Goal | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = readString(record.id);
  const name = readString(record.name).trim();
  const targetAmount = readPositive(record.targetAmount);
  if (!id || !name || targetAmount === null) return null;
  const currentRaw = readNonNegative(record.currentAmount) ?? 0;
  const deadline = readDate(record.deadline);
  const emoji = readString(record.emoji);
  return {
    id,
    name,
    targetAmount,
    currentAmount: Math.min(currentRaw, targetAmount),
    deadline: deadline ?? undefined,
    emoji: emoji || undefined,
    createdAt: readTimestamp(record.createdAt, deadline ?? undefined),
  };
}

function normalizeSalaryConfig(value: unknown): SalaryConfig | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const amount = readPositive(record.amount);
  const frequencyRaw = readString(record.frequency);
  const payDay = readInt(record.payDay);
  if (amount === null || !SALARY_FREQUENCIES.has(frequencyRaw as SalaryFrequency) || payDay === null) {
    return null;
  }
  if (payDay < 0 || payDay > 31) return null;
  const frequency = frequencyRaw as SalaryFrequency;
  const payDay2 = readInt(record.payDay2);
  return {
    amount,
    frequency,
    payDay,
    payDay2: frequency === "biweekly" && payDay2 !== null && payDay2 >= 1 && payDay2 <= 31 ? payDay2 : undefined,
    label: readString(record.label).trim() || "Mi sueldo",
  };
}

function normalizeSalaryPayment(value: unknown): SalaryPayment | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = readString(record.id);
  const amount = readPositive(record.amount);
  const date = readDate(record.date);
  if (!id || amount === null || !date) return null;
  const note = readString(record.note).trim();
  return { id, amount, date, note: note || undefined };
}

function normalizeCard(value: unknown): CreditCard | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = readString(record.id);
  const networkRaw = readString(record.network).toLowerCase();
  if (!id || !CARD_NETWORKS.has(networkRaw as CardNetwork)) return null;
  const label = readString(record.label).trim() || "Tarjeta";
  const lastFour = readString(record.lastFourDigits).replace(/\D/g, "").slice(-4);
  const color = readString(record.color);
  return {
    id,
    label,
    network: networkRaw as CardNetwork,
    issuerKey: readString(record.issuerKey) || "otro",
    creditLimit: readNonNegative(record.creditLimit) ?? 0,
    usedAmount: readNonNegative(record.usedAmount) ?? 0,
    lastFourDigits: lastFour || undefined,
    color: color || undefined,
    createdAt: readTimestamp(record.createdAt),
  };
}

function normalizeInstallment(value: unknown): CardInstallment | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = readString(record.id);
  const cardId = readString(record.cardId);
  const description = readString(record.description).trim();
  const totalAmount = readPositive(record.totalAmount);
  const totalInstallments = readPositiveInt(record.totalInstallments);
  const startDate = readDate(record.startDate);
  if (!id || !cardId || !description || totalAmount === null || !totalInstallments || !startDate) return null;
  const paidRaw = readNonNegative(record.paidInstallments) ?? 0;
  const paidInstallments = Math.min(Math.floor(paidRaw), totalInstallments);
  return {
    id,
    cardId,
    description,
    totalAmount,
    totalInstallments,
    paidInstallments,
    startDate,
  };
}

function normalizeSubscription(value: unknown): Subscription | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = readString(record.id);
  const name = readString(record.name).trim();
  const price = readPositive(record.price);
  const currencyRaw = readString(record.currency).toUpperCase();
  const periodRaw = readString(record.period);
  const startDate = readDate(record.startDate);
  if (
    !id ||
    !name ||
    price === null ||
    !SUB_CURRENCIES.has(currencyRaw as SubCurrency) ||
    !SUB_PERIODS.has(periodRaw as SubPeriod) ||
    !startDate
  ) {
    return null;
  }
  const categoryRaw = readString(record.category);
  return {
    id,
    name,
    domain: readString(record.domain),
    price,
    currency: currencyRaw as SubCurrency,
    period: periodRaw as SubPeriod,
    startDate,
    active: record.active !== false,
    category: SUB_CATEGORIES.has(categoryRaw as SubCategory) ? (categoryRaw as SubCategory) : "other",
    createdAt: readTimestamp(record.createdAt, startDate),
  };
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readPositive(value: unknown): number | null {
  const parsed = readNumber(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function readNonNegative(value: unknown): number | null {
  const parsed = readNumber(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

function readInt(value: unknown): number | null {
  const parsed = readNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function readPositiveInt(value: unknown): number | null {
  const parsed = readInt(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function readDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  if (!match) return null;
  const [year, month, day] = match[1].split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return match[1];
}

function readTimestamp(value: unknown, fallbackDate?: string): string {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  if (fallbackDate) return `${fallbackDate}T00:00:00.000Z`;
  return new Date(0).toISOString();
}
