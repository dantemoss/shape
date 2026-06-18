"use client";

import { Goal } from "@/lib/types";
import NumberFlow from "@number-flow/react";

interface GoalsMiniProps {
  goals: Goal[];
}

export function GoalsMini({ goals }: GoalsMiniProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {goals.slice(0, 4).map((goal) => {
        const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
        const remaining = goal.targetAmount - goal.currentAmount;
        return (
          <div key={goal.id} className="border border-border rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                {goal.emoji && (
                  <span className="text-lg mr-2">{goal.emoji}</span>
                )}
                <span className="text-sm font-medium">{goal.name}</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {percentage}%
              </span>
            </div>
            <div className="flex gap-[2px] mb-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className={`flex-1 h-1 rounded-full ${i < Math.round(percentage / 5) ? "bg-income" : "bg-border"}`} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>
                $<NumberFlow value={goal.currentAmount} locales="es-AR" />
              </span>
              <span>
                Faltan $
                <NumberFlow value={remaining} locales="es-AR" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
