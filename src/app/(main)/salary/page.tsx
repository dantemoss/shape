"use client";

import { useState } from "react";
import { useShapeStore } from "@/lib/store";
import { SalarySetup } from "@/components/salary-setup";
import { SalaryCountdown } from "@/components/salary-countdown";
import { SalaryHistory } from "@/components/salary-history";
import { SalaryReview } from "@/components/salary-review";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function SalaryPage() {
  const [editing, setEditing] = useState(false);
  const salaryConfig = useShapeStore((s) => s.salaryConfig);

  return (
    <div className="min-h-screen">
      <div className="page-head">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="text-lg font-medium">Sueldo</h1>
          <span className="text-sm text-muted-foreground">
            {salaryConfig ? salaryConfig.label : "Sin configurar"}
          </span>
        </div>
        {salaryConfig && !editing && (
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={() => setEditing(true)}>
            <Settings size={15} />
          </Button>
        )}
        {editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
        )}
      </div>

      <div className="px-4 sm:px-8 py-6 sm:py-8 flex flex-col items-center space-y-6">
        {(!salaryConfig || editing) ? (
          <div className="w-full max-w-sm">
            <SalarySetup onSave={() => setEditing(false)} />
          </div>
        ) : (
          <div className="w-full max-w-xl space-y-6">
            <SalaryCountdown config={salaryConfig} />
            <SalaryReview />
            <SalaryHistory />
          </div>
        )}
      </div>
    </div>
  );
}
