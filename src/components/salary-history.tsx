"use client";

import { useShapeStore } from "@/lib/store";
import { Trash2, Wallet } from "lucide-react";
import { formatIso } from "@/lib/format-date";
import { Amount, Card, EmptyState, IconWell, ListRow } from "@/components/primitives";

export function SalaryHistory() {
  const salaryPayments = useShapeStore((s) => s.salaryPayments);
  const removeSalaryPayment = useShapeStore((s) => s.removeSalaryPayment);
  const totalCobrado = salaryPayments.reduce((sum, payment) => sum + payment.amount, 0);

  if (salaryPayments.length === 0) {
    return <EmptyState title="Todavía no registraste ningún cobro" />;
  }

  return (
    <Card
      title="Historial de cobros"
      action={<Amount value={totalCobrado} tone="income" animate className="text-[13px] font-semibold" />}
    >
      <ul className="divide-y divide-black/[0.04]">
        {salaryPayments.map((payment) => (
          <li key={payment.id}>
            <ListRow
              className="py-3"
              icon={
                <IconWell>
                  <Wallet size={15} />
                </IconWell>
              }
              title={payment.note ?? "Cobro registrado"}
              meta={`${formatIso(payment.date, "EEEE d 'de' MMMM yyyy")}${payment.incomeId ? " · vinculado al ingreso" : " · sin ingreso vinculado"}`}
              amount={<Amount value={payment.amount} tone="income" signed />}
              trailing={
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-full text-[#8b919c] hover:bg-[#f4f5f7] hover:text-[#1c1f26]"
                  title="Eliminar el cobro y su ingreso"
                  aria-label="Eliminar el cobro y su ingreso"
                  onClick={() => removeSalaryPayment(payment.id)}
                >
                  <Trash2 size={14} />
                </button>
              }
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
