export type TransactionType = "income" | "expense";

export type ExpenseCategory =
  | "housing"
  | "food"
  | "transport"
  | "entertainment"
  | "health"
  | "education"
  | "subscriptions"
  | "clothing"
  | "savings"
  | "other";

export type RecurrenceType = "once" | "monthly" | "weekly" | "yearly";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: ExpenseCategory;
  recurrence: RecurrenceType;
  date: string;
  // installments
  hasInstallments: boolean;
  totalInstallments?: number;
  currentInstallment?: number;
  cardName?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  emoji?: string;
  createdAt: string;
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  housing: "Vivienda",
  food: "Comida",
  transport: "Transporte",
  entertainment: "Entretenimiento",
  health: "Salud",
  education: "Educación",
  subscriptions: "Suscripciones",
  clothing: "Ropa",
  savings: "Ahorro",
  other: "Otro",
};

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  once: "Una vez",
  monthly: "Mensual",
  weekly: "Semanal",
  yearly: "Anual",
};

export type SalaryFrequency = "monthly" | "biweekly" | "weekly";

export interface SalaryConfig {
  amount: number;
  frequency: SalaryFrequency;
  // day of month (1-31) for monthly/biweekly, or day of week (0-6 Sun-Sat) for weekly
  payDay: number;
  // for biweekly: second pay day of the month
  payDay2?: number;
  label: string;
}

export interface SalaryPayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export const SALARY_FREQUENCY_LABELS: Record<SalaryFrequency, string> = {
  monthly: "Mensual",
  biweekly: "Quincenal",
  weekly: "Semanal",
};

// ── Credit Cards ────────────────────────────────────────────────

export type CardNetwork = "visa" | "mastercard" | "amex";

export interface CreditCard {
  id: string;
  label: string;           // nombre personalizado
  network: CardNetwork;
  issuerKey: string;       // key para lookup de logo/color
  creditLimit: number;
  usedAmount: number;      // saldo actual
  lastFourDigits?: string;
  color?: string;          // color de card (overrides issuer default)
  createdAt: string;
}

export interface CardInstallment {
  id: string;
  cardId: string;
  description: string;
  totalAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  startDate: string;       // ISO date of first installment
}

export interface IssuerInfo {
  name: string;
  color: string;
  textColor: string;
  abbr: string;
  type: "bank" | "fintech";
  domain: string;
}

export const ISSUERS: Record<string, IssuerInfo> = {
  santander:   { name: "Santander",       color: "#EC0000", textColor: "#fff", abbr: "S",  type: "bank",    domain: "santander.com.ar" },
  bbva:        { name: "BBVA",            color: "#004481", textColor: "#fff", abbr: "B",  type: "bank",    domain: "bbva.com.ar" },
  galicia:     { name: "Galicia",         color: "#D91A22", textColor: "#fff", abbr: "G",  type: "bank",    domain: "galicia.com.ar" },
  hsbc:        { name: "HSBC",            color: "#CC0000", textColor: "#fff", abbr: "H",  type: "bank",    domain: "hsbc.com.ar" },
  nacion:      { name: "Banco Nación",    color: "#1B4F8A", textColor: "#fff", abbr: "BN", type: "bank",    domain: "bna.com.ar" },
  provincia:   { name: "Banco Provincia", color: "#0055A4", textColor: "#fff", abbr: "BP", type: "bank",    domain: "bpba.com.ar" },
  ciudad:      { name: "Banco Ciudad",    color: "#0072CE", textColor: "#fff", abbr: "BC", type: "bank",    domain: "bancociudad.com.ar" },
  icbc:        { name: "ICBC",            color: "#C8102E", textColor: "#fff", abbr: "I",  type: "bank",    domain: "icbc.com.ar" },
  macro:       { name: "Macro",           color: "#FFB300", textColor: "#000", abbr: "M",  type: "bank",    domain: "macro.com.ar" },
  patagonia:   { name: "Patagonia",       color: "#0B3D91", textColor: "#fff", abbr: "P",  type: "bank",    domain: "bancopatagonia.com.ar" },
  brubank:     { name: "Brubank",         color: "#5B21B6", textColor: "#fff", abbr: "Br", type: "fintech", domain: "brubank.com" },
  mercadopago: { name: "Mercado Pago",    color: "#009EE3", textColor: "#fff", abbr: "MP", type: "fintech", domain: "mercadopago.com" },
  naranjax:    { name: "Naranja X",       color: "#FF6600", textColor: "#fff", abbr: "NX", type: "fintech", domain: "naranjax.com" },
  uala:        { name: "Uala",            color: "#00C897", textColor: "#fff", abbr: "U",  type: "fintech", domain: "uala.com.ar" },
  personalpay: { name: "Personal Pay",    color: "#00C5BE", textColor: "#fff", abbr: "PP", type: "fintech", domain: "personal.com.ar" },
  lemon:       { name: "Lemon Cash",      color: "#B5E300", textColor: "#000", abbr: "Le", type: "fintech", domain: "lemoncash.com" },
  prex:        { name: "Prex",            color: "#2D2D8F", textColor: "#fff", abbr: "Px", type: "fintech", domain: "prexcard.com" },
  otro:        { name: "Otro",            color: "#374151", textColor: "#fff", abbr: "?",  type: "bank",    domain: "" },
};
