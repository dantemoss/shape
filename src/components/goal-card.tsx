"use client";

import { useState } from "react";
import { Goal } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Check } from "lucide-react";
import { Amount, IconWell, Stat, StatRow } from "@/components/primitives";
import { cn } from "@/lib/utils";
import { formatIso } from "@/lib/format-date";

interface GoalCardProps {
  goal: Goal;
  index: number;
  onRemove: (id: string) => void;
  onAddAmount: (id: string, amount: number) => void;
}

export function GoalCard({ goal, onRemove, onAddAmount }: GoalCardProps) {
  const [adding, setAdding] = useState(false);
  const [addAmount, setAddAmount] = useState("");

  const percentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
  const remaining = goal.targetAmount - goal.currentAmount;
  const isComplete = goal.currentAmount >= goal.targetAmount;
  function handleAddAmount(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(addAmount.replace(",", "."));
    if (!parsed || parsed <= 0) return;
    onAddAmount(goal.id, parsed);
    setAddAmount("");
    setAdding(false);
  }

  return (
    <div className={cn("viz-card", isComplete && "ring-1 ring-[#1f9d55]/30")}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-semibold tracking-[-0.03em]">{goal.name}</h3>
          {isComplete ? <p className="text-[12px] font-medium text-[#1f9d55]">Completada</p> : null}
        </div>
        <button
          type="button"
          onClick={() => onRemove(goal.id)}
          aria-label="Eliminar meta"
        >
          <IconWell size="sm">
            <Trash2 size={14} />
          </IconWell>
        </button>
      </div>
      <div className="space-y-3">
        <StatRow columns={2}>
          <Stat label="Ahorrado" size="lg" value={<Amount value={goal.currentAmount} size="hero" tone={isComplete ? "income" : "neutral"} animate />} />
          <Stat label="Objetivo" value={<Amount value={goal.targetAmount} />} className="text-right" />
        </StatRow>

        {/* Barra segmentada */}
        <div className="flex gap-[3px]">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="h-2.5 flex-1 rounded-[4px]"
              style={{ background: i < Math.round((percentage / 100) * 24) ? (isComplete ? "#1f9d55" : "#f97316") : "#f1f2f4" }}
            />
          ))}
        </div>

        {/* Falta */}
        {!isComplete && (
          <p className="text-[13px] text-[#6d7480]">
            Faltan <Amount value={remaining} size="secondary" />
          </p>
        )}

        {goal.deadline && (
          <p className="text-[12px] text-[#9aa1ab]">Límite: {formatIso(goal.deadline, "d MMM yyyy")}</p>
        )}

        {/* Agregar ahorro */}
        {!isComplete && (
          !adding ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={() => setAdding(true)}
            >
              <Plus size={12} />
              Agregar ahorro
            </Button>
          ) : (
            <form onSubmit={handleAddAmount} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="pl-6 text-sm tabular-nums"
                  autoFocus
                />
              </div>
              <Button type="submit" size="sm">
                <Check size={13} />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                ✕
              </Button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
