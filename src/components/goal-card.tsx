"use client";

import { useState } from "react";
import { Goal } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Check } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ── Backgrounds de header ────────────────────────────────────────────────────
// Las primeras dos metas usan las imágenes reales; el resto cicla gradientes
const IMAGE_HEADERS = [
  "linear-gradient(rgba(0,0,0,0.25),rgba(0,0,0,0.55)), url('/goal-header.jpg')",
  "linear-gradient(rgba(0,0,0,0.25),rgba(0,0,0,0.55)), url('/goal2.png')",
];

const GRADIENT_HEADERS = [
  "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
  "linear-gradient(135deg, #1a0000, #3d0000, #6b0000)",
  "linear-gradient(135deg, #000d1a, #003d3d, #005c35)",
  "linear-gradient(135deg, #0d001a, #2d006b, #4a008b)",
  "linear-gradient(135deg, #1a1000, #3d2800, #6b4500)",
];

function getHeaderBg(index: number): string {
  if (index < IMAGE_HEADERS.length) return IMAGE_HEADERS[index];
  return GRADIENT_HEADERS[(index - IMAGE_HEADERS.length) % GRADIENT_HEADERS.length];
}

// ── Radial SVG para el progreso circular ────────────────────────────────────
function CircleProgress({ percentage }: { percentage: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const filled = (Math.min(percentage, 100) / 100) * circ;

  return (
    <svg width={52} height={52} className="-rotate-90">
      <circle cx={26} cy={26} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={3} />
      <circle
        cx={26} cy={26} r={r}
        fill="none"
        stroke="white"
        strokeWidth={3}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

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
  const headerBg = getHeaderBg(index);

  function handleAddAmount(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(addAmount.replace(",", "."));
    if (!parsed || parsed <= 0) return;
    onAddAmount(goal.id, parsed);
    setAddAmount("");
    setAdding(false);
  }

  return (
    <div className={cn(
      "border border-border rounded-2xl overflow-hidden bg-card transition-all duration-150 group",
      isComplete && "border-income/40"
    )}>
      {/* ── Header visual ── */}
      <div
        className="relative h-32 overflow-hidden"
        style={{ background: headerBg, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Overlay sutil */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Progress circle — top right */}
        <div className="absolute top-3 right-3 flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <CircleProgress percentage={percentage} />
            <span className="absolute text-[10px] font-bold text-white font-mono">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Botón eliminar — top left, aparece en hover */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={() => onRemove(goal.id)}
                className="absolute top-3 left-3 w-7 h-7 rounded-full bg-black/40 text-white/70 hover:bg-black/60 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              />
            }
          >
            <Trash2 size={12} />
          </TooltipTrigger>
          <TooltipContent side="right">Eliminar meta</TooltipContent>
        </Tooltip>

        {/* Nombre de la meta — bottom left */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent">
          <h3 className="text-sm font-semibold text-white leading-tight">
            {goal.name}
          </h3>
          {isComplete && (
            <span className="text-[10px] text-income font-mono">✓ completado</span>
          )}
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="p-4 space-y-3">
        {/* Montos */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              Ahorrado
            </p>
            <p className="text-xl font-bold font-mono text-income">
              $<NumberFlow value={goal.currentAmount} locales="es-AR" format={{ maximumFractionDigits: 0 }} />
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              Objetivo
            </p>
            <p className="text-base font-semibold font-mono text-muted-foreground">
              $<NumberFlow value={goal.targetAmount} locales="es-AR" format={{ maximumFractionDigits: 0 }} />
            </p>
          </div>
        </div>

        {/* Barra segmentada */}
        <div className="flex gap-[3px]">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-1 rounded-full transition-all duration-500",
                i < Math.round(percentage / 5) ? "bg-income" : "bg-border"
              )}
              style={{ transitionDelay: `${i * 30}ms` }}
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
            Límite: {new Date(goal.deadline).toLocaleDateString("es-AR")}
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
