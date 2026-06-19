"use client";

import { useState } from "react";
import { useShapeStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface InstallmentFormProps {
  cardId: string;
  onSuccess?: () => void;
}

export function InstallmentForm({ cardId, onSuccess }: InstallmentFormProps) {
  const addCardInstallment = useShapeStore((s) => s.addCardInstallment);

  const [description, setDescription] = useState("");
  const [total, setTotal] = useState("");
  const [totalInst, setTotalInst] = useState("12");
  const [paid, setPaid] = useState("0");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !total) return;
    addCardInstallment({
      cardId,
      description: description.trim(),
      totalAmount: parseFloat(total.replace(/\./g, "").replace(",", ".")) || 0,
      totalInstallments: parseInt(totalInst) || 1,
      paidInstallments: parseInt(paid) || 0,
      startDate,
    });
    onSuccess?.();
  }

  const monthly = (parseFloat(total.replace(/\./g, "").replace(",", ".")) || 0) / (parseInt(totalInst) || 1);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Descripción</Label>
        <Input
          placeholder="iPhone 16, Heladera, etc."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Monto total</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <Input
            placeholder="250.000"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            className="pl-7"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Total de cuotas</Label>
          <Input
            type="number"
            min="1"
            max="60"
            value={totalInst}
            onChange={(e) => setTotalInst(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Cuotas ya pagadas</Label>
          <Input
            type="number"
            min="0"
            max={totalInst}
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Fecha primer cuota</Label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      {monthly > 0 && (
        <div className="bg-muted/50 rounded-xl p-3 text-sm text-center font-mono text-muted-foreground">
          ${Math.round(monthly).toLocaleString("es-AR")} / mes ·{" "}
          {parseInt(totalInst) - parseInt(paid)} cuotas restantes
        </div>
      )}

      <Button type="submit" className="w-full" disabled={!description.trim() || !total}>
        Agregar cuota
      </Button>
    </form>
  );
}
