import { Transaction, CATEGORY_LABELS, ExpenseCategory } from "./types";

export interface RecurringExpense {
  description: string;
  category: ExpenseCategory;
  count: number;
  totalAmount: number;
  avgAmount: number;
  lastDate: string;
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  label: string;
  amount: number;
  count: number;
  percentage: number; // % of total expenses
  salaryPercentage: number; // % of salary
}

export interface HealthInsight {
  type: "warning" | "tip" | "positive";
  title: string;
  description: string;
}

export interface MonthComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

export function getRecurringExpenses(transactions: Transaction[]): RecurringExpense[] {
  const expenses = transactions.filter((t) => t.type === "expense");
  const grouped: Record<string, Transaction[]> = {};

  expenses.forEach((tx) => {
    const key = tx.description.toLowerCase().trim();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  });

  return Object.entries(grouped)
    .filter(([, txs]) => txs.length >= 2)
    .map(([, txs]) => {
      const totalAmount = txs.reduce((s, t) => s + t.amount, 0);
      return {
        description: txs[0].description,
        category: txs[0].category,
        count: txs.length,
        totalAmount,
        avgAmount: totalAmount / txs.length,
        lastDate: txs.sort((a, b) => b.date.localeCompare(a.date))[0].date,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 8);
}

export function getCategoryBreakdown(
  transactions: Transaction[],
  salaryAmount: number
): CategoryBreakdown[] {
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);

  const byCategory: Partial<Record<ExpenseCategory, { amount: number; count: number }>> = {};

  expenses.forEach((tx) => {
    if (!byCategory[tx.category]) byCategory[tx.category] = { amount: 0, count: 0 };
    byCategory[tx.category]!.amount += tx.amount;
    byCategory[tx.category]!.count += 1;
  });

  return Object.entries(byCategory)
    .map(([cat, data]) => ({
      category: cat as ExpenseCategory,
      label: CATEGORY_LABELS[cat as ExpenseCategory],
      amount: data!.amount,
      count: data!.count,
      percentage: totalExpenses > 0 ? (data!.amount / totalExpenses) * 100 : 0,
      salaryPercentage: salaryAmount > 0 ? (data!.amount / salaryAmount) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function getMonthComparison(transactions: Transaction[]): MonthComparison {
  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const expenses = transactions.filter((t) => t.type === "expense");

  const current = expenses
    .filter((t) => t.date.startsWith(thisMonthKey))
    .reduce((s, t) => s + t.amount, 0);

  const previous = expenses
    .filter((t) => t.date.startsWith(prevMonthKey))
    .reduce((s, t) => s + t.amount, 0);

  const change = current - previous;
  const changePercent = previous > 0 ? (change / previous) * 100 : 0;

  return { current, previous, change, changePercent };
}

export function generateInsights(
  transactions: Transaction[],
  salaryAmount: number
): HealthInsight[] {
  const insights: HealthInsight[] = [];
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  const breakdown = getCategoryBreakdown(transactions, salaryAmount);
  const recurring = getRecurringExpenses(transactions);
  const monthComp = getMonthComparison(transactions);

  // Ratio gasto/sueldo
  if (salaryAmount > 0) {
    const ratio = (totalExpenses / salaryAmount) * 100;
    if (ratio > 90) {
      insights.push({
        type: "warning",
        title: "Gastos muy elevados",
        description: `Estás gastando el ${Math.round(ratio)}% de tu sueldo. Tratá de mantenerlo por debajo del 80%.`,
      });
    } else if (ratio > 70) {
      insights.push({
        type: "tip",
        title: "Margen ajustado",
        description: `Tus gastos son el ${Math.round(ratio)}% de tu sueldo. Queda un margen del ${Math.round(100 - ratio)}% para ahorrar.`,
      });
    } else if (ratio < 60 && ratio > 0) {
      insights.push({
        type: "positive",
        title: "Buen control de gastos",
        description: `Estás gastando solo el ${Math.round(ratio)}% de tu sueldo. Tenés ${Math.round(100 - ratio)}% disponible para ahorro o metas.`,
      });
    }
  }

  // Suscripciones
  const subsTotal = breakdown.find((b) => b.category === "subscriptions");
  if (subsTotal && salaryAmount > 0 && subsTotal.salaryPercentage > 10) {
    insights.push({
      type: "warning",
      title: "Muchas suscripciones",
      description: `Las suscripciones se llevan el ${Math.round(subsTotal.salaryPercentage)}% de tu sueldo ($${subsTotal.amount.toLocaleString("es-AR")}). Revisá cuáles realmente usás.`,
    });
  }

  // Gastos repetitivos
  if (recurring.length >= 3) {
    const totalRecurring = recurring.reduce((s, r) => s + r.totalAmount, 0);
    insights.push({
      type: "tip",
      title: `${recurring.length} gastos repetitivos detectados`,
      description: `Tenés patrones de gasto repetido por un total de $${totalRecurring.toLocaleString("es-AR")}. Revisá si todos son necesarios.`,
    });
  }

  // Comparación mensual
  if (monthComp.previous > 0 && Math.abs(monthComp.changePercent) > 15) {
    if (monthComp.change > 0) {
      insights.push({
        type: "warning",
        title: "Gastos en aumento",
        description: `Este mes gastás ${Math.round(monthComp.changePercent)}% más que el mes pasado ($${Math.abs(monthComp.change).toLocaleString("es-AR")} de diferencia).`,
      });
    } else {
      insights.push({
        type: "positive",
        title: "Reduciste tus gastos",
        description: `Este mes gastás ${Math.round(Math.abs(monthComp.changePercent))}% menos que el mes pasado. ¡Buen trabajo!`,
      });
    }
  }

  // Categoría dominante
  if (breakdown.length > 0 && breakdown[0].percentage > 40) {
    insights.push({
      type: "tip",
      title: `${breakdown[0].label} domina tus gastos`,
      description: `El ${Math.round(breakdown[0].percentage)}% de tus gastos van a "${breakdown[0].label}". Considerá diversificar o revisar esa categoría.`,
    });
  }

  // Cuotas activas
  const installments = expenses.filter((t) => t.hasInstallments);
  if (installments.length > 0) {
    const totalInstallments = installments.reduce((s, t) => s + t.amount, 0);
    insights.push({
      type: "tip",
      title: `${installments.length} pagos en cuotas activos`,
      description: `Tenés $${totalInstallments.toLocaleString("es-AR")} comprometidos en cuotas. Tené esto en cuenta para los próximos meses.`,
    });
  }

  if (insights.length === 0 && transactions.length === 0) {
    insights.push({
      type: "tip",
      title: "Sin datos todavía",
      description: "Empezá a registrar tus movimientos para ver tu análisis financiero aquí.",
    });
  }

  return insights;
}
