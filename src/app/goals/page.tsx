"use client";

import { useState } from "react";
import { useShapeStore } from "@/lib/store";
import { GoalCard } from "@/components/goal-card";
import { GoalForm } from "@/components/goal-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function GoalsPage() {
  const [open, setOpen] = useState(false);
  const goals = useShapeStore((s) => s.goals);
  const removeGoal = useShapeStore((s) => s.removeGoal);
  const updateGoalAmount = useShapeStore((s) => s.updateGoalAmount);

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <div className="min-h-screen">
      <div className="border-b border-border px-8 py-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Metas</h1>
          {goals.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              <span className="text-income font-mono font-medium">${totalSaved.toLocaleString("es-AR")}</span>
              {" "}ahorrado de{" "}
              <span className="font-mono">${totalTarget.toLocaleString("es-AR")}</span>
            </p>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" className="gap-2" />}>
            <Plus size={14} />
            Nueva meta
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nueva meta</DialogTitle>
            </DialogHeader>
            <GoalForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-8 py-6">
        {goals.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
            <p className="text-4xl mb-4">🎯</p>
            <p className="text-sm font-medium">Todavía no tenés metas</p>
            <p className="text-xs mt-1">Creá una para empezar a ahorrar para lo que querés</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-w-3xl">
            {goals.map((goal, i) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={i}
                onRemove={removeGoal}
                onAddAmount={updateGoalAmount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
