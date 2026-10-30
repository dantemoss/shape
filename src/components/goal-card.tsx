"use client";

import { useState } from "react";
import { Goal } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Check } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";
import { formatIso } from "@/lib/format-date";

interface GoalCardProps {
  goal: Goal;
  index: number;
  onRemove: (id: string) => void;
  onAddAmount: (id: string, amount: number) => void;
}

export function GoalCard({ goal, index, onRemove, onAddAmount }: GoalCardProps) {
  const [adding, setAdding] = useState(false);
  const [addAmount, setAddAmount] = useState("");

  const percentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
  const remaining = goal.targetAmount - goal.currentAmount;
  const isComplete = goal.currentAmount >= goal.targetAmount;
  const tones = ["#166534", "#1d4ed8", "#c2410c", "#7c3aed"];
  const tone = tones[index % tones.length];

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
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f6f7f9] text-[#8b919c]"
          aria-label="Eliminar meta"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="space-y-3">
        {/* Montos */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              Ahorrado
            </p>
            <p className="num text-[1.6rem]" style={{ color: tone }}>
              $<NumberFlow value={goal.currentAmount} locales="es-AR" format={{ maximumFractionDigits: 0 }} />
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              Objetivo
            </p>
            <p className="text-base font-medium font-mono text-muted-foreground">
              $<NumberFlow value={goal.targetAmount} locales="es-AR" format={{ maximumFractionDigits: 0 }} />
            </p>
          </div>
        </div>

        {/* Barra segmentada */}
        <div className="flex gap-[3px]">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="h-2.5 flex-1 rounded-[4px]"
              style={{ background: i < Math.round((percentage / 100) * 24) ? tone : "#f1f2f4" }}
            />
          ))}
        </div>

        {/* Falta */}
        {!isComplete && (
          <p className="text-xs text-muted-foreground">
            Faltan{" "}
            <span className="font-mono font-medium text-foreground">
              $<NumberFlow value={remaining} locales="es-AR" format={{ maximumFractionDigits: 0 }} />
            </span>
          </p>
        )}

        {goal.deadline && (
          <p className="text-xs text-muted-foreground font-mono">
            Límite: {formatIso(goal.deadline, "d MMM yyyy")}
          </p>
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
                  className="pl-6 font-mono text-sm"
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
