"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShapeStore } from "@/lib/store";
import {
  POPULAR_SERVICES, SUB_PERIOD_LABELS,
  type SubPeriod, type SubCurrency, type SubCategory, type PopularService,
} from "@/lib/types";
import { ServiceMark } from "@/components/service-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { IconWell } from "@/components/primitives";
import { Search, Plus, ChevronLeft } from "lucide-react";
import { todayISO } from "@/lib/dates";

interface Props { onSuccess: () => void; }

const SLIDE = {
  initial:  { opacity: 0, x: 24 },
  animate:  { opacity: 1, x: 0 },
  exit:     { opacity: 0, x: -24 },
  transition: { duration: 0.2 },
};

export function SubscriptionForm({ onSuccess }: Props) {
  const addSubscription = useShapeStore((s) => s.addSubscription);

  const [step, setStep]             = useState(0);
  const [search, setSearch]         = useState("");
  const [selectedService, setSelectedService] = useState<PopularService | null>(null);
  const [customName, setCustomName] = useState("");
  const [customDomain, setCustomDomain] = useState("");

  // Step 2 fields
  const [price, setPrice]       = useState("");
  const [currency, setCurrency] = useState<SubCurrency>("ARS");
  const [period, setPeriod]     = useState<SubPeriod>("monthly");
  const [startDate, setStartDate] = useState(todayISO());

  const filtered = POPULAR_SERVICES.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  function pickService(svc: PopularService) {
    setSelectedService(svc);
    setCurrency(svc.currency);
    setStep(1);
  }

  function pickCustom() {
    setSelectedService(null);
    setStep(1);
  }

  function back() {
    setStep(0);
    setSelectedService(null);
    setCustomName("");
    setCustomDomain("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name   = selectedService?.name   ?? customName.trim();
    const domain = selectedService?.domain ?? customDomain.trim();
    const cat: SubCategory = selectedService?.category ?? "other";
    if (!name || !price) return;

    addSubscription({
      name,
      domain,
      price:     parseFloat(price),
      currency,
      period,
      startDate,
      active:    true,
      category:  cat,
    });
    onSuccess();
  }

  const activeName = selectedService?.name ?? (customName || "Personalizado");

  return (
    <div className="overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {step === 0 ? (
          <motion.div key="step0" {...SLIDE} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Elegí un servicio conocido o creá uno personalizado
            </p>

            {/* Buscador */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar servicio…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Grid de servicios */}
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-0.5">
              {filtered.map((svc) => (
                <button
                  key={svc.name}
                  type="button"
                  onClick={() => pickService(svc)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-foreground/30 hover:bg-muted/40 transition-all text-center"
                >
                  <ServiceMark name={svc.name} domain={svc.domain} />
                  <span className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                    {svc.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Personalizado */}
            <button
              type="button"
              onClick={pickCustom}
              className="flex w-full items-center gap-2 rounded-xl border border-border p-3 text-sm text-[#6d7480] transition-colors duration-200 ease-out hover:bg-[#f6f7f9]"
            >
              <IconWell size="sm">
                <Plus size={13} />
              </IconWell>
              Agregar servicio personalizado
            </button>
          </motion.div>
        ) : (
          <motion.div key="step1" {...SLIDE}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Servicio seleccionado */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                <button type="button" onClick={back} className="text-muted-foreground hover:text-foreground">
                  <ChevronLeft size={16} />
                </button>
                <ServiceMark name={activeName} domain={selectedService?.domain ?? ""} />
                <span className="text-sm font-medium">{activeName}</span>
              </div>

              {/* Nombre personalizado */}
              {!selectedService && (
                <div className="space-y-1.5">
                  <Label>Nombre del servicio</Label>
                  <Input
                    placeholder="Ej: Figma Pro"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Precio + moneda */}
              <div className="space-y-1.5">
                <Label>Precio</Label>
                <div className="flex gap-2">
                  <div className="flex rounded-xl border border-border overflow-hidden shrink-0">
                    {(["ARS", "USD"] as SubCurrency[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCurrency(c)}
                        className={cn(
                          "px-3 py-2 text-[13px] font-medium transition-colors duration-200 ease-out",
                          currency === c
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Período */}
              <div className="space-y-1.5">
                <Label>Frecuencia</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(SUB_PERIOD_LABELS) as [SubPeriod, string][]).map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPeriod(val)}
                      className={cn(
                        "py-2 rounded-xl border text-xs font-medium transition-all",
                        period === val
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      )}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fecha de inicio / próxima renovación */}
              <div className="space-y-1.5">
                <Label>Próxima renovación</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!price || parseFloat(price) <= 0 || (!selectedService && !customName.trim())}
              >
                Agregar suscripción
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
