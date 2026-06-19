"use client";

import { useEffect, useState } from "react";
import { SalaryConfig } from "@/lib/types";
import { getNextPaymentDate, getPaymentProgress, NextPayment } from "@/lib/salary-utils";
import NumberFlow from "@number-flow/react";
import { useShapeStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SalaryCountdownProps {
  config: SalaryConfig;
}

// ── Barra de segmentos de días ────────────────────────────────────────────
function DaySegments({ progress, frequency }: { progress: number; frequency: SalaryConfig["frequency"] }) {
  const total = frequency === "weekly" ? 7 : frequency === "biweekly" ? 15 : 30;
  const filled = Math.round((progress / 100) * total);

  return (
    <div className="space-y-2">
      <div className="flex gap-[3px]">
        {Array.from({ length: total }).map((_, i) => (
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
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>día 1</span>
        <span className="text-income font-medium">día {filled} de {total}</span>
        <span>día {total}</span>
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

  const addSalaryPayment = useShapeStore((s) => s.addSalaryPayment);
  const addTransaction = useShapeStore((s) => s.addTransaction);

  useEffect(() => {
    function update() {
      setNext(getNextPaymentDate(config));
      setProgress(getPaymentProgress(config));
    }
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [config]);

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(registerAmount.replace(",", "."));
    if (!amount || amount <= 0) return;
    const today = new Date().toISOString().split("T")[0];
    addSalaryPayment({ amount, date: today, note: registerNote || undefined });
    addTransaction({
      type: "income",
      amount,
      description: registerNote || config.label,
      category: "other",
      recurrence: config.frequency === "weekly" ? "weekly" : "monthly",
      date: today,
      hasInstallments: false,
    });
    setRegisterOpen(false);
    setRegisterNote("");
  }

  if (!next) return null;

  return (
    <div className="space-y-4 flex flex-col items-center w-full">
      {/* ── Card principal ── */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border",
          next.isToday ? "border-income/40" : "border-border"
        )}
        style={{ backgroundColor: "oklch(1 0 0)" }}
      >
        {/* Imagen de fondo — azul, en el margen derecho, fusionada */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url('/salary-bg.png')",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right -10px top",
            backgroundSize: "48% auto",
            opacity: 0.07,
            maskImage: "linear-gradient(to left, black 0%, black 20%, transparent 65%)",
            WebkitMaskImage: "linear-gradient(to left, black 0%, black 20%, transparent 65%)",
          }}
        />

        {/* Botón icono — esquina superior derecha */}
        {!registerOpen && (
          <div className="absolute top-5 right-5 z-20">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    onClick={() => setRegisterOpen(true)}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150",
                      "border shadow-sm hover:-translate-y-0.5 hover:shadow-md",
                      next.isToday
                        ? "bg-income text-income-foreground border-income/40"
                        : "bg-background text-muted-foreground border-border hover:text-foreground"
                    )}
                  />
                }
              >
                <CheckCircle2 size={16} />
              </TooltipTrigger>
              <TooltipContent side="top" align="end">
                Registrar como recibido
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Contenido — empujado hacia abajo */}
        <div className="relative z-10 px-8 pt-10 pb-8">
          {/* Label sin ícono */}
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-8">
            {config.label}
          </p>

          {/* Monto — grande, hacia abajo */}
          <div className="mb-8">
            <p className="text-[3.25rem] font-medium tracking-tight leading-none">
              $<NumberFlow
                value={config.amount}
                locales="es-AR"
                format={{ maximumFractionDigits: 0 }}
              />
            </p>
            <p className="text-xs text-muted-foreground mt-2">monto esperado de cobro</p>
          </div>

          {/* Grid de stats */}
          <div className="grid grid-cols-3 gap-6 mb-7">
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1.5">
                Próximo cobro
              </p>
              <p className="text-2xl font-medium leading-none capitalize">
                {format(next.date, "d 'de' MMM", { locale: es })}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1.5">
                {next.isToday ? "¡Es hoy!" : "Días restantes"}
              </p>
              <p className={cn(
                "text-2xl font-medium font-mono tabular-nums leading-none",
                next.isToday || next.daysLeft <= 3 ? "text-income" : "text-foreground"
              )}>
                {next.isToday ? "🎉" : <NumberFlow value={next.daysLeft} />}
                {!next.isToday && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">días</span>
                )}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1.5">
                Período
              </p>
              <p className="text-2xl font-medium font-mono tabular-nums leading-none">
                <NumberFlow value={Math.round(progress)} />
                <span className="text-sm font-normal text-muted-foreground ml-0.5">%</span>
              </p>
            </div>
          </div>

          {/* Segmentos de días */}
          <DaySegments progress={progress} frequency={config.frequency} />
        </div>
      </div>

      {/* ── Formulario de registro ── */}
      {registerOpen && (
        <div className="w-full border border-border rounded-2xl p-6 bg-card">
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
                  className="pl-7 font-mono"
                  autoFocus
                />
              </div>
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
              <Button type="submit" className="flex-1">Confirmar</Button>
              <Button type="button" variant="ghost" onClick={() => setRegisterOpen(false)}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
