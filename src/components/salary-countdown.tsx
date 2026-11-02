"use client";

import { useEffect, useState } from "react";
import { SalaryConfig } from "@/lib/types";
import { getNextPaymentDate, NextPayment, planSalaryRegistration } from "@/lib/salary-utils";
import { todayISO } from "@/lib/dates";
import { formatIso } from "@/lib/format-date";
import NumberFlow from "@number-flow/react";
import { useShapeStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Plus } from "lucide-react";
import { Amount, IconWell, InfoTip, Stat, StatRow } from "@/components/primitives";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SalaryCountdownProps {
  config: SalaryConfig;
}

// ── Barra de segmentos de días ────────────────────────────────────────────
function DaySegments({ elapsed, total }: { elapsed: number; total: number }) {
  const slots = Math.min(Math.max(total, 1), 24);
  const filled = Math.round((elapsed / Math.max(total, 1)) * slots);

  return (
    <div className="space-y-2">
      <div className="flex gap-[3px]">
        {Array.from({ length: slots }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-[5px] rounded-full transition-all duration-500",
              i < filled ? "bg-income" : "bg-border"
            )}
            style={{ transitionDelay: `${i * 12}ms` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[12px] text-[#9aa1ab]">
        <span>Día 1</span>
        <span className="font-medium text-[#1c1f26]">Día {elapsed} de {total}</span>
        <span>Día {total}</span>
      </div>
    </div>
  );
}

export function SalaryCountdown({ config }: SalaryCountdownProps) {
  const [next, setNext] = useState<NextPayment | null>(null);
  const [progress, setProgress] = useState(0);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerAmount, setRegisterAmount] = useState(config.amount.toString());
  const [registerNote, setRegisterNote] = useState("");
  const [registerDate, setRegisterDate] = useState(todayISO());
  const [registerError, setRegisterError] = useState<string | null>(null);

  const addSalaryPayment = useShapeStore((s) => s.addSalaryPayment);
  const salaryPayments = useShapeStore((s) => s.salaryPayments);
  const plan = planSalaryRegistration(config, salaryPayments, registerDate);

  useEffect(() => {
    function update() {
      const upcoming = getNextPaymentDate(config, new Date(), salaryPayments);
      setNext(upcoming);
      setProgress(upcoming.period.progress);
    }
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [config, salaryPayments]);

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(registerAmount.replace(",", "."));
    if (!amount || amount <= 0 || !registerDate) return;
    if (!plan.ok) {
      setRegisterError(plan.reason);
      return;
    }
    addSalaryPayment({ amount, date: registerDate, note: registerNote || undefined });
    setRegisterOpen(false);
    setRegisterNote("");
    setRegisterDate(todayISO());
    setRegisterError(null);
  }

  if (!next) return null;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="viz-card relative">
        {!registerOpen && (
          <div className="absolute top-4 right-4 z-20">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button type="button" onClick={() => setRegisterOpen(true)} aria-label="Registrar como recibido" />
                }
              >
                <IconWell>
                  <CheckCircle2 size={16} />
                </IconWell>
              </TooltipTrigger>
              <TooltipContent side="top" align="end">
                Registrar como recibido
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        <div className="mb-4 flex items-center gap-2 pr-12">
          <p className="truncate text-[15px] font-medium text-[#1c1f26]">{config.label}</p>
          <InfoTip
            label="Cómo entra el sueldo"
            text="Es el monto esperado de cobro. No entra al saldo hasta que lo marcás como cobrado."
          />
        </div>

        <p>
          <Amount value={config.amount} size="hero" animate />
        </p>

        <StatRow className="mt-5 border-t border-black/[0.06] pt-4">
          <Stat label="Próximo cobro" value={format(next.date, "d 'de' MMM", { locale: es })} />
          <Stat
            label={next.isToday ? "Es hoy" : "Días restantes"}
            value={next.isToday ? "Hoy" : <NumberFlow value={next.daysLeft} />}
            hint={next.isToday ? undefined : "días"}
            tone={next.isToday || next.daysLeft <= 3 ? "text-income" : undefined}
          />
          <Stat label="Período" value={<>{Math.round(progress)}%</>} />
        </StatRow>

        <div className="mt-5">
          <DaySegments elapsed={next.period.daysElapsed} total={next.period.periodDays} />
        </div>
      </div>

      {/* ── Formulario de registro ── */}
      {registerOpen && (
        <div className="viz-card">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Plus size={14} />
            Registrar cobro
          </h3>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Monto cobrado</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={registerAmount}
                  onChange={(e) => setRegisterAmount(e.target.value)}
                  className="pl-7 tabular-nums"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salary-date">Fecha en que cobraste</Label>
              <Input
                id="salary-date"
                type="date"
                value={registerDate}
                onChange={(event) => {
                  setRegisterDate(event.target.value);
                  setRegisterError(null);
                }}
                required
              />
              <p className="text-xs text-muted-foreground">
                {plan.ok
                  ? `Corresponde al cobro del ${formatIso(plan.coveredPayday, "d 'de' MMMM")}. El próximo esperado pasa a ser el ${formatIso(plan.nextPayday, "d 'de' MMMM")}.`
                  : plan.reason}
              </p>
              {registerError && <p className="text-xs text-expense">{registerError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Nota (opcional)</Label>
              <Input
                placeholder="Ej: con bono, descuento obra social..."
                value={registerNote}
                onChange={(e) => setRegisterNote(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={!plan.ok}>Confirmar</Button>
              <Button type="button" variant="ghost" onClick={() => setRegisterOpen(false)}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
