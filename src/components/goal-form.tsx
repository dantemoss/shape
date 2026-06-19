"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShapeStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronRight, Check, Target } from "lucide-react";

// ── Sugerencias de metas ────────────────────────────────────────────────────
const GOAL_SUGGESTIONS = [
  { name: "PlayStation 5", amount: 800000 },
  { name: "iPhone",        amount: 1500000 },
  { name: "Viaje",         amount: 500000 },
  { name: "Notebook",      amount: 1200000 },
  { name: "Auto",          amount: 5000000 },
  { name: "Fondo de emergencia", amount: 300000 },
];

// ── Step dots ───────────────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ width: i === current ? 20 : 6, opacity: i <= current ? 1 : 0.3 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={cn("h-1.5 rounded-full", i <= current ? "bg-foreground" : "bg-border")}
        />
      ))}
    </div>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

interface GoalFormProps {
  onSuccess?: () => void;
}

export function GoalForm({ onSuccess }: GoalFormProps) {
  const addGoal = useShapeStore((s) => s.addGoal);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 0) nameInputRef.current?.focus();
    if (step === 1) amountInputRef.current?.focus();
  }, [step]);

  const parsedTarget = parseFloat(targetAmount) || 0;
  const parsedCurrent = parseFloat(currentAmount) || 0;

  const canProceed =
    step === 0 ? name.trim().length > 0 :
    step === 1 ? parsedTarget > 0 :
    true;

  function goNext() {
    if (step < 2) { setDir(1); setStep(step + 1); }
    else submit();
  }

  function goBack() {
    setDir(-1);
    setStep(step - 1);
  }

  function submit() {
    if (!name.trim() || parsedTarget <= 0) return;
    addGoal({
      name: name.trim(),
      targetAmount: parsedTarget,
      currentAmount: Math.min(parsedCurrent, parsedTarget),
      deadline: deadline || undefined,
      emoji: undefined,
    });
    onSuccess?.();
  }

  return (
    <div className="space-y-5">
      <StepDots current={step} total={3} />

      <div className="overflow-hidden min-h-[260px]">
        <AnimatePresence mode="wait" custom={dir}>

          {/* ── STEP 0: Nombre ── */}
          {step === 0 && (
            <motion.div
              key="step-name"
              custom={dir}
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="space-y-5"
            >
              <div className="text-center space-y-1">
                <Target size={28} className="mx-auto text-muted-foreground mb-3" strokeWidth={1.5} />
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                  ¿Para qué estás ahorrando?
                </p>
              </div>

              <input
                ref={nameInputRef}
                type="text"
                placeholder="Ej: PlayStation 5, viaje a Brasil..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canProceed && goNext()}
                className="w-full text-center text-xl font-medium bg-transparent border-none outline-none placeholder:text-muted-foreground/40 placeholder:font-normal placeholder:text-lg"
              />

              {/* Sugerencias */}
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {GOAL_SUGGESTIONS.map((s) => (
                  <motion.button
                    key={s.name}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setName(s.name);
                      setTargetAmount(s.amount.toString());
                    }}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-all duration-150",
                      name === s.name
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    {s.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: Monto objetivo ── */}
          {step === 1 && (
            <motion.div
              key="step-amount"
              custom={dir}
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="space-y-4"
            >
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                  ¿Cuánto necesitás?
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-medium text-muted-foreground">$</span>
                <input
                  ref={amountInputRef}
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canProceed && goNext()}
                  className="text-5xl font-medium bg-transparent border-none outline-none w-48 text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {parsedTarget > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm text-muted-foreground"
                >
                  {parsedTarget.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
                </motion.p>
              )}

              {/* Montos sugeridos */}
              <div className="flex flex-wrap gap-2 justify-center">
                {[100000, 250000, 500000, 1000000, 2000000].map((v) => (
                  <motion.button
                    key={v}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTargetAmount(v.toString())}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border font-mono transition-all duration-150",
                      parseFloat(targetAmount) === v
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    ${(v / 1000).toFixed(0)}k
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Detalles opcionales ── */}
          {step === 2 && (
            <motion.div
              key="step-details"
              custom={dir}
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="space-y-4"
            >
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                  Detalles (opcional)
                </p>
              </div>

              {/* Ya tenés algo ahorrado? */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">¿Ya tenés algo ahorrado?</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    autoFocus
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="pl-7 font-mono"
                  />
                </div>
                {parsedCurrent > 0 && parsedTarget > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-income font-mono"
                  >
                    Ya vas {Math.round((parsedCurrent / parsedTarget) * 100)}% camino a la meta
                  </motion.p>
                )}
              </div>

              {/* Fecha límite */}
              <div className="flex items-center justify-between py-2 border-t border-border">
                <span className="text-sm text-muted-foreground">Fecha límite</span>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="text-sm font-medium text-right bg-transparent border-none outline-none cursor-pointer text-muted-foreground"
                />
              </div>

              {/* Resumen */}
              <div className="bg-muted/40 rounded-xl p-3 border border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Objetivo</span>
                  <span className="font-mono font-medium">${parsedTarget.toLocaleString("es-AR")}</span>
                </div>
                {parsedCurrent > 0 && (
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Ya ahorrado</span>
                    <span className="font-mono font-medium text-income">${parsedCurrent.toLocaleString("es-AR")}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-muted-foreground">Falta</span>
                  <span className="font-mono font-medium">${Math.max(parsedTarget - parsedCurrent, 0).toLocaleString("es-AR")}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navegación */}
      <div className="flex gap-2 pt-1">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={goBack} className="gap-1.5">
            <ArrowLeft size={14} />
            Atrás
          </Button>
        )}
        <Button
          type="button"
          onClick={goNext}
          disabled={!canProceed}
          className="flex-1 gap-2"
        >
          {step < 2 ? (
            <>Continuar <ChevronRight size={15} /></>
          ) : (
            <><Check size={15} /> Crear meta</>
          )}
        </Button>
      </div>
    </div>
  );
}
