"use client";

import { useState } from "react";
import { useShapeStore } from "@/lib/store";
import { SalaryFrequency, SALARY_FREQUENCY_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

interface SalarySetupProps {
  onSave?: () => void;
}

export function SalarySetup({ onSave }: SalarySetupProps) {
  const setSalaryConfig = useShapeStore((s) => s.setSalaryConfig);
  const existing = useShapeStore((s) => s.salaryConfig);

  const [label, setLabel] = useState(existing?.label ?? "Mi sueldo");
  const [amount, setAmount] = useState(existing?.amount?.toString() ?? "");
  const [frequency, setFrequency] = useState<SalaryFrequency>(
    existing?.frequency ?? "monthly"
  );
  const [payDay, setPayDay] = useState(existing?.payDay?.toString() ?? "25");
  const [payDay2, setPayDay2] = useState(existing?.payDay2?.toString() ?? "10");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!parsedAmount || parsedAmount <= 0) return;

    setSalaryConfig({
      label,
      amount: parsedAmount,
      frequency,
      payDay: parseInt(payDay),
      payDay2: frequency === "biweekly" ? parseInt(payDay2) : undefined,
    });

    onSave?.();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-5">
      {/* Nombre */}
      <div className="space-y-1.5">
        <Label htmlFor="salary-label">Nombre</Label>
        <Input
          id="salary-label"
          placeholder="Ej: Sueldo OSPADEP"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />
      </div>

      {/* Monto */}
      <div className="space-y-1.5">
        <Label htmlFor="salary-amount">Monto neto</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            $
          </span>
          <Input
            id="salary-amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7 font-mono"
            required
          />
        </div>
      </div>

      {/* Frecuencia */}
      <div className="space-y-1.5">
        <Label>Frecuencia de cobro</Label>
        <Select
          value={frequency}
          onValueChange={(v) => setFrequency(v as SalaryFrequency)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SALARY_FREQUENCY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Día de cobro */}
      {frequency === "weekly" ? (
        <div className="space-y-1.5">
          <Label>Día de cobro</Label>
          <Select
            value={payDay.toString()}
              onValueChange={(v) => v && setPayDay(v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map((d) => (
                <SelectItem key={d.value} value={d.value.toString()}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : frequency === "biweekly" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="payday1">1er cobro (día del mes)</Label>
            <Input
              id="payday1"
              type="number"
              min="1"
              max="31"
              value={payDay}
              onChange={(e) => setPayDay(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payday2">2do cobro (día del mes)</Label>
            <Input
              id="payday2"
              type="number"
              min="1"
              max="31"
              value={payDay2}
              onChange={(e) => setPayDay2(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="payday-monthly">Día de cobro (del mes)</Label>
          <Input
            id="payday-monthly"
            type="number"
            min="1"
            max="31"
            value={payDay}
            onChange={(e) => setPayDay(e.target.value)}
            className="font-mono"
            placeholder="25"
          />
        </div>
      )}

      <Button type="submit" className="w-full">
        Guardar
      </Button>
    </form>
  );
}
