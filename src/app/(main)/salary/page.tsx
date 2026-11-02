"use client";

import { useState } from "react";
import { useShapeStore } from "@/lib/store";
import { SalarySetup } from "@/components/salary-setup";
import { SalaryCountdown } from "@/components/salary-countdown";
import { SalaryHistory } from "@/components/salary-history";
import { SalaryReview } from "@/components/salary-review";
import { PageHeader, pageStackClass } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function SalaryPage() {
  const [editing, setEditing] = useState(false);
  const salaryConfig = useShapeStore((s) => s.salaryConfig);

  return (
    <div className="min-w-0">
      <PageHeader
        title="Sueldo"
        subtitle={salaryConfig ? salaryConfig.label : "Sin configurar"}
        action={
          salaryConfig && !editing ? (
            <Button variant="ghost" size="icon-sm" className="text-[#6d7480]" onClick={() => setEditing(true)} aria-label="Editar sueldo">
              <Settings size={15} />
            </Button>
          ) : editing ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          ) : null
        }
      />

      <div className={pageStackClass}>
        {!salaryConfig || editing ? (
          <div className="mx-auto w-full max-w-sm">
            <SalarySetup onSave={() => setEditing(false)} />
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
            <SalaryCountdown config={salaryConfig} />
            <SalaryReview />
            <SalaryHistory />
          </div>
        )}
      </div>
    </div>
  );
}
