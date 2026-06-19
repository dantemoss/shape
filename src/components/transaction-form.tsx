"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShapeStore } from "@/lib/store";
import {
  TransactionType,
  ExpenseCategory,
  RecurrenceType,
  RECURRENCE_LABELS,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ChevronDown, ArrowLeft, Check, ChevronRight,
  Utensils, Car, Smartphone, Gamepad2, Home,
  HeartPulse, ShoppingBag, BookOpen, PiggyBank, Sparkles,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ─── Categorías con ícono y etiqueta ────────────────────────────────────────
const CATEGORIES: { value: ExpenseCategory; label: string; icon: LucideIcon; suggestions: string[] }[] = [
  { value: "food",          label: "Comida",        icon: Utensils,    suggestions: ["Supermercado", "Delivery", "Restaurante", "Almuerzo"] },
  { value: "transport",     label: "Transporte",    icon: Car,         suggestions: ["SUBE", "Nafta", "Taxi", "Uber"] },
  { value: "subscriptions", label: "Suscripciones", icon: Smartphone,  suggestions: ["Netflix", "Spotify", "Disney+", "Cursor"] },
  { value: "entertainment", label: "Ocio",          icon: Gamepad2,    suggestions: ["Cine", "Videojuego", "Salida", "Bar"] },
  { value: "housing",       label: "Vivienda",      icon: Home,        suggestions: ["Alquiler", "Expensas", "Servicios", "Internet"] },
  { value: "health",        label: "Salud",         icon: HeartPulse,  suggestions: ["Farmacia", "Médico", "Obra Social", "Turno"] },
  { value: "clothing",      label: "Ropa",          icon: ShoppingBag, suggestions: ["Ropa", "Zapatillas", "Indumentaria"] },
  { value: "education",     label: "Educación",     icon: BookOpen,    suggestions: ["Curso", "Libro", "Universidad", "Material"] },
  { value: "savings",       label: "Ahorro",        icon: PiggyBank,   suggestions: ["Inversión", "Plazo fijo", "Dólar"] },
  { value: "other",         label: "Otro",          icon: Sparkles,    suggestions: ["Gasto", "Pago", "Transferencia"] },
];

const INCOME_SUGGESTIONS = ["Sueldo", "Freelance", "Venta", "Reintegro", "Bono", "Transferencia recibida"];

// ─── Step indicator ──────────────────────────────────────────────────────────
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

// ─── Slide animation variants ────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

interface TransactionFormProps {
  onSuccess?: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const addTransaction = useShapeStore((s) => s.addTransaction);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  // Step 0 — Monto + tipo
  const [type, setType] = useState<TransactionType>("expense");
  const [rawAmount, setRawAmount] = useState("");

  // Step 1 — Categoría (solo para gastos)
  const [category, setCategory] = useState<ExpenseCategory>("other");

  // Step 2 — Descripción + detalles
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>("once");
  const [hasInstallments, setHasInstallments] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState("3");
  const [currentInstallment, setCurrentInstallment] = useState("1");
  const [cardName, setCardName] = useState("");

  const amountInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = type === "income" ? 2 : 3;
  const amount = parseFloat(rawAmount) || 0;

  useEffect(() => {
    if (step === 0) amountInputRef.current?.focus();
  }, [step]);

  // Auto-suggest description when category changes
  useEffect(() => {
    if (!description && category) {
      const cat = CATEGORIES.find((c) => c.value === category);
      if (cat) setDescription(cat.suggestions[0]);
    }
  }, [category]);

  function goNext() {
    setDir(1);
    if (type === "income") {
      if (step === 0) setStep(2); // skip category for income
      else submit();
    } else {
      if (step < 2) setStep(step + 1);
      else submit();
    }
  }

  function goBack() {
    setDir(-1);
    if (type === "income" && step === 2) setStep(0);
    else setStep(step - 1);
  }

  function submit() {
    if (!amount || amount <= 0) return;
    addTransaction({
      type,
      amount,
      description: description || (type === "income" ? "Ingreso" : CATEGORIES.find((c) => c.value === category)?.label ?? "Gasto"),
      category: type === "income" ? "other" : category,
      recurrence,
      date,
      hasInstallments: type === "expense" && hasInstallments,
      totalInstallments: hasInstallments ? parseInt(totalInstallments) : undefined,
      currentInstallment: hasInstallments ? parseInt(currentInstallment) : undefined,
      cardName: hasInstallments ? cardName : undefined,
    });
    onSuccess?.();
  }

  const canProceed =
    step === 0 ? amount > 0 :
    step === 1 ? !!category :
    true;

  const currentCat = CATEGORIES.find((c) => c.value === category);

  return (
    <div className="space-y-5">
      <StepDots current={step === 0 ? 0 : step === 1 ? 1 : 2} total={totalSteps} />

      <div className="overflow-hidden min-h-[300px]">
        <AnimatePresence mode="wait" custom={dir}>
          {/* ── STEP 0: Monto + Tipo ── */}
          {step === 0 && (
            <motion.div
              key="step-amount"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="space-y-6"
            >
              {/* Toggle tipo */}
              <div className="flex rounded-xl border border-border overflow-hidden bg-muted/30">
                {(["expense", "income"] as TransactionType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-medium transition-all duration-200",
                      type === t && t === "expense" && "bg-expense text-expense-foreground shadow-sm",
                      type === t && t === "income" && "bg-income text-income-foreground shadow-sm",
                      type !== t && "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t === "expense" ? "Gasto" : "Ingreso"}
                  </button>
                ))}
              </div>

              {/* Input de monto — hero */}
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                  ¿Cuánto?
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className={cn(
                    "text-4xl font-medium transition-colors",
                    type === "income" ? "text-income" : "text-expense"
                  )}>$</span>
                  <input
                    ref={amountInputRef}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={rawAmount}
                    onChange={(e) => setRawAmount(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && canProceed && goNext()}
                    className={cn(
                      "text-5xl font-medium bg-transparent border-none outline-none w-48 text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                      type === "income" ? "text-income" : "text-expense"
                    )}
                  />
                </div>
                {amount > 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-muted-foreground"
                  >
                    {amount.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: Categoría ── */}
          {step === 1 && (
            <motion.div
              key="step-category"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="space-y-3"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono text-center">
                ¿Qué tipo de gasto?
              </p>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = category === cat.value;
                  return (
                    <motion.button
                      key={cat.value}
                      type="button"
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setCategory(cat.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-150",
                        active
                          ? "border-foreground bg-foreground text-background shadow-md"
                          : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      )}
                    >
                      <Icon size={18} strokeWidth={1.75} />
                      <span className="text-[10px] font-medium leading-none">{cat.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Descripción + detalles ── */}
          {step === 2 && (
            <motion.div
              key="step-details"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="space-y-4"
            >
              {/* Descripción con sugerencias */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                  ¿Para qué fue?
                </p>
                <Input
                  autoFocus
                  placeholder={type === "income" ? "Descripción del ingreso..." : `${currentCat?.label}...`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goNext()}
                  className="text-sm"
                />
                {/* Sugerencias rápidas */}
                <div className="flex flex-wrap gap-1.5">
                  {(type === "income" ? INCOME_SUGGESTIONS : (currentCat?.suggestions ?? [])).map((s) => (
                    <motion.button
                      key={s}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDescription(s)}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full border transition-all duration-150",
                        description === s
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      )}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Fecha amigable */}
              <div className="flex items-center justify-between py-2 border-t border-border">
                <span className="text-sm text-muted-foreground">Fecha</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-sm font-medium text-right bg-transparent border-none outline-none cursor-pointer"
                />
              </div>

              {/* Opciones avanzadas */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-1"
                >
                  <motion.span animate={{ rotate: showAdvanced ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={13} />
                  </motion.span>
                  Más opciones
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 space-y-3">
                        {/* Frecuencia */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">Frecuencia</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setRecurrence(r)}
                                className={cn(
                                  "text-xs px-3 py-1 rounded-full border transition-all",
                                  recurrence === r
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-border text-muted-foreground hover:border-foreground/40"
                                )}
                              >
                                {RECURRENCE_LABELS[r]}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Cuotas (solo gastos) */}
                        {type === "expense" && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Pago en cuotas</span>
                            <button
                              type="button"
                              onClick={() => setHasInstallments(!hasInstallments)}
                              className={cn(
                                "w-9 h-5 rounded-full transition-colors relative",
                                hasInstallments ? "bg-foreground" : "bg-muted"
                              )}
                            >
                              <motion.span
                                animate={{ x: hasInstallments ? 16 : 2 }}
                                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                className="absolute top-0.5 w-4 h-4 rounded-full bg-background inline-block"
                              />
                            </button>
                          </div>
                        )}

                        <AnimatePresence>
                          {hasInstallments && type === "expense" && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-3 gap-2 pt-1">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Cuota</p>
                                  <Input type="number" min="1" value={currentInstallment}
                                    onChange={(e) => setCurrentInstallment(e.target.value)} className="h-8 text-sm font-mono" />
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                                  <Input type="number" min="1" value={totalInstallments}
                                    onChange={(e) => setTotalInstallments(e.target.value)} className="h-8 text-sm font-mono" />
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Tarjeta</p>
                                  <Input placeholder="Visa..." value={cardName}
                                    onChange={(e) => setCardName(e.target.value)} className="h-8 text-sm" />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Botones de navegación */}
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
          className={cn(
            "flex-1 gap-2",
            type === "income" ? "bg-income text-income-foreground hover:opacity-90" : ""
          )}
        >
          {step < (totalSteps - 1) ? (
            <>Continuar <ChevronRight size={15} /></>
          ) : (
            <>
              <Check size={15} />
              {type === "income" ? "Registrar ingreso" : "Registrar gasto"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
