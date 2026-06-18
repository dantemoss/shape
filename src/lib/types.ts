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
