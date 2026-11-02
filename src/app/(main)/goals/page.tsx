"use client";

import { useState } from "react";
import { useShapeStore } from "@/lib/store";
import { GoalCard } from "@/components/goal-card";
import { GoalForm } from "@/components/goal-form";
import { Amount, EmptyState, IconWell, PageHeader, pageStackClass } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Plus, Target } from "lucide-react";
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

  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  return (
    <div className="min-w-0">
      <PageHeader
        title="Metas"
        subtitle={
          goals.length > 0 ? (
            <span>
              <Amount value={totalSaved} tone="income" animate /> / <Amount value={totalTarget} animate />
            </span>
          ) : (
            "Lo que estás juntando"
          )
        }
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button className="gap-2 rounded-full" />}>
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
        }
      />

      <div className={pageStackClass}>
        {goals.length === 0 ? (
          <EmptyState
            icon={
              <IconWell size="lg">
                <Target size={18} />
              </IconWell>
            }
            title="Todavía no tenés metas"
          >
            Creá una para empezar a ahorrar para lo que querés.
          </EmptyState>
        ) : (
          <div className="grid max-w-3xl grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
            {goals.map((goal, index) => (
              <GoalCard key={goal.id} goal={goal} index={index} onRemove={removeGoal} onAddAmount={updateGoalAmount} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
