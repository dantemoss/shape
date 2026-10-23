"use client";

import { Button } from "@/components/ui/button";
import { formatIso } from "@/lib/format-date";
import { formatPesos } from "@/lib/money";
import { reviewSalaryRecords } from "@/lib/salary-links";
import { useShapeStore } from "@/lib/store";

export function SalaryReview() {
  const payments = useShapeStore((s) => s.salaryPayments);
  const transactions = useShapeStore((s) => s.transactions);
  const config = useShapeStore((s) => s.salaryConfig);
  const linkSalaryIncome = useShapeStore((s) => s.linkSalaryIncome);
  const attachSalaryIncome = useShapeStore((s) => s.attachSalaryIncome);
  const setIncomeCountsInBalance = useShapeStore((s) => s.setIncomeCountsInBalance);

  if (!config) return null;

  const incomes = transactions.filter((tx) => tx.type === "income");
  const review = reviewSalaryRecords(payments, incomes, config.label, config);
  const hasWork =
    review.duplicatePeriods.length > 0 ||
    review.unlinked.length > 0 ||
    review.extras.length > 0;
  if (!hasWork) return null;

  return (
    <section className="border border-border rounded-2xl p-5 bg-card space-y-4">
      <div>
        <h2 className="text-sm font-medium">Cobros para revisar</h2>
        <p className="text-xs text-muted-foreground mt-1">
          No borramos nada solos. Vincular une el cobro con su ingreso: si después borrás uno, se va el otro. Sacar del saldo deja el movimiento guardado, pero deja de sumar.
        </p>
      </div>

      {review.duplicatePeriods.map((group) => (
        <p key={group.periodKey} className="text-sm">
          Hay {group.paymentIds.length} cobros para el período que cierra el{" "}
          {formatIso(group.periodKey, "d 'de' MMMM yyyy")}. Dejá el que corresponda y eliminá el otro en el historial.
        </p>
      ))}

      {review.unlinked.map((item) => {
        const payment = payments.find((candidate) => candidate.id === item.paymentId);
        if (!payment) return null;
        return (
          <div key={item.paymentId} className="border border-border rounded-xl p-3 space-y-2">
            <p className="text-sm">
              El cobro del {formatIso(payment.date, "d 'de' MMM")} ({formatPesos(payment.amount)}) no está vinculado a un ingreso.
            </p>
            {item.candidateIncomeIds.length === 0 ? (
              <Button type="button" size="sm" variant="outline" onClick={() => attachSalaryIncome(payment.id)}>
                Sumar este cobro al saldo
              </Button>
            ) : (
              item.candidateIncomeIds.map((incomeId) => {
                const income = incomes.find((candidate) => candidate.id === incomeId);
                if (!income) return null;
                return (
                  <div key={incomeId} className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground truncate">
                      {income.description} · {formatPesos(income.amount)}
                    </p>
                    <Button type="button" size="sm" variant="outline" onClick={() => linkSalaryIncome(payment.id, incomeId)}>
                      Vincular
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        );
      })}

      {review.extras.map((extra) => {
        const income = incomes.find((candidate) => candidate.id === extra.incomeId);
        if (!income) return null;
        return (
          <div key={extra.incomeId} className="flex items-center justify-between gap-3 border border-border rounded-xl p-3">
            <p className="text-sm">
              “{income.description}” del {formatIso(income.date, "d 'de' MMM")} parece una copia del cobro y sigue sumando al saldo.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIncomeCountsInBalance(extra.incomeId, false)}
            >
              Sacar del saldo
            </Button>
          </div>
        );
      })}
    </section>
  );
}
