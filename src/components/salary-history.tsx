"use client";

import { useShapeStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import NumberFlow from "@number-flow/react";

export function SalaryHistory() {
  const salaryPayments = useShapeStore((s) => s.salaryPayments);
  const removeSalaryPayment = useShapeStore((s) => s.removeSalaryPayment);

  if (salaryPayments.length === 0) {
    return (
      <div className="border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
        Todavía no registraste ningún cobro
      </div>
    );
  }

  const totalCobrado = salaryPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Historial de cobros
        </h2>
        <span className="text-xs font-mono text-muted-foreground">
          Total: $<NumberFlow value={totalCobrado} locales="es-AR" format={{ maximumFractionDigits: 0 }} />
        </span>
      </div>

      <div className="space-y-2">
        {salaryPayments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between gap-4 p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {payment.note ?? "Cobro registrado"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {format(new Date(payment.date), "EEEE d 'de' MMMM yyyy", { locale: es })}
              </p>
            </div>

            <span className="text-sm font-mono font-semibold shrink-0">
              +$<NumberFlow value={payment.amount} locales="es-AR" format={{ maximumFractionDigits: 0 }} />
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => removeSalaryPayment(payment.id)}
            >
              <Trash2 size={13} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
