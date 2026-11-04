/**
 * Detección liviana de cargos que se repiten.
 * Función pura, sin red ni estado: sirve en el cliente con el libro ya cargado
 * y también en un server component si más adelante el libro se lee ahí.
 */
import { monthKey } from "./dates";
import type { SubCategory, Subscription, Transaction } from "./types";

export type ChargeCurrency = "ARS" | "USD";

export interface ChargeSeries {
  key: string;
  label: string;
  currency: ChargeCurrency;
  latestAmount: number;
  previousAmount: number;
  latestDate: string;
  chargeCount: number;
  increased: boolean;
}

export interface PriceIncrease {
  subscriptionId: string;
  latestAmount: number;
  previousAmount: number;
}

interface MonthCharge {
  amount: number;
  date: string;
  label: string;
}

interface Bucket {
  key: string;
  currency: ChargeCurrency;
  byMonth: Map<string, MonthCharge>;
  /** Más de un cobro en el mismo mes: no es una suscripción mensual. */
  crowded: boolean;
}

export function foldChargeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function chargeLabel(transaction: Transaction): string {
  const merchant = transaction.merchant?.trim();
  if (merchant) return merchant;
  return transaction.description.trim();
}

function chargeCurrency(transaction: Transaction): ChargeCurrency | null {
  const code = (transaction.currency ?? "ARS").toUpperCase();
  if (code === "ARS" || code === "USD") return code;
  return null;
}

function monthIndex(yearMonth: string): number {
  const [year, month] = yearMonth.split("-").map(Number);
  return year * 12 + (month - 1);
}

function collect(transactions: Transaction[]): Bucket[] {
  const groups = new Map<string, Bucket>();
  for (const transaction of transactions) {
    if (transaction.type !== "expense" || transaction.hasInstallments || transaction.kind === "salary") continue;
    if (transaction.countsInBalance === false) continue;
    const currency = chargeCurrency(transaction);
    const label = chargeLabel(transaction);
    const key = foldChargeKey(label);
    const month = monthKey(transaction.date);
    if (!currency || key.length < 2 || !month) continue;
    const id = `${currency}:${key}`;
    let bucket = groups.get(id);
    if (!bucket) {
      bucket = { key, currency, byMonth: new Map(), crowded: false };
      groups.set(id, bucket);
    }
    if (bucket.byMonth.has(month)) bucket.crowded = true;
    else bucket.byMonth.set(month, { amount: transaction.amount, date: transaction.date, label });
  }
  return [...groups.values()];
}

function consecutiveRun(bucket: Bucket): MonthCharge[] {
  if (bucket.crowded) return [];
  const months = [...bucket.byMonth.keys()].sort();
  let best: string[] = [];
  let run: string[] = [];
  for (const month of months) {
    const previous = run[run.length - 1];
    if (!previous || monthIndex(month) === monthIndex(previous) + 1) run.push(month);
    else run = [month];
    if (run.length > best.length) best = [...run];
  }
  if (best.length < 2) return [];
  const charges = best.map((month) => bucket.byMonth.get(month)!);
  for (let index = 1; index < charges.length; index += 1) {
    const previous = charges[index - 1].amount;
    const next = charges[index].amount;
    const high = Math.max(previous, next);
    const close = high > 0 && Math.abs(previous - next) / high <= 0.15;
    const raise = next > previous && next <= previous * 1.8;
    if (!close && !raise) return [];
  }
  return charges;
}

function toSeries(bucket: Bucket): ChargeSeries | null {
  const run = consecutiveRun(bucket);
  if (run.length < 2) return null;
  const latest = run[run.length - 1];
  const previous = run[run.length - 2];
  return {
    key: bucket.key,
    label: latest.label,
    currency: bucket.currency,
    latestAmount: latest.amount,
    previousAmount: previous.amount,
    latestDate: latest.date,
    chargeCount: run.length,
    increased: latest.amount > previous.amount * 1.04,
  };
}

function matchesSubscription(bucket: Bucket, subscription: Subscription): boolean {
  if (subscription.currency !== bucket.currency) return false;
  const name = foldChargeKey(subscription.name);
  if (!name) return false;
  if (name === bucket.key) return true;
  const shorter = Math.min(name.length, bucket.key.length);
  if (shorter < 4) return false;
  return name.includes(bucket.key) || bucket.key.includes(name);
}

const CATEGORY_BY_KEY: Record<string, SubCategory> = {
  netflix: "streaming",
  disney: "streaming",
  "hbo max": "streaming",
  max: "streaming",
  "amazon prime": "streaming",
  "apple tv": "streaming",
  "youtube premium": "streaming",
  youtube: "streaming",
  spotify: "music",
  "pedidosya plus": "food",
  "rappi prime": "food",
  "cursor ai": "productivity",
  cursor: "productivity",
  "google gemini": "productivity",
  "chatgpt plus": "productivity",
  notion: "productivity",
  "github copilot": "productivity",
  icloud: "storage",
  "google one": "storage",
  "xbox game pass": "gaming",
  "playstation plus": "gaming",
};

export function categoryForName(name: string): SubCategory {
  return CATEGORY_BY_KEY[foldChargeKey(name)] ?? "other";
}

export function detectRecurringCharges(
  transactions: Transaction[],
  subscriptions: Subscription[]
): { suggestions: ChargeSeries[]; increases: PriceIncrease[] } {
  const suggestions: ChargeSeries[] = [];
  const increases: PriceIncrease[] = [];

  for (const bucket of collect(transactions)) {
    const series = toSeries(bucket);
    if (!series) continue;
    const existing = subscriptions.find((subscription) => matchesSubscription(bucket, subscription));
    if (!existing) {
      suggestions.push(series);
      continue;
    }
    if (series.increased && series.latestAmount > existing.price * 1.03) {
      increases.push({
        subscriptionId: existing.id,
        latestAmount: series.latestAmount,
        previousAmount: series.previousAmount,
      });
    }
  }

  suggestions.sort((a, b) => b.latestDate.localeCompare(a.latestDate) || a.label.localeCompare(b.label, "es"));
  return { suggestions, increases };
}
