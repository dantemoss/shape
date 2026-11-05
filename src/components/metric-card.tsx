"use client";

import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface MetricCardProps {
  label: string;
  value: number;
  variant?: "default" | "income" | "expense";
  prefix?: string;
  suffix?: string;
  href?: string;
  empty?: boolean;
  emptyHint?: string;
  sublabel?: string;
}

export function MetricCard({
  label,
  value,
  variant = "default",
  prefix = "",
  suffix = "",
  href,
  empty,
  emptyHint,
  sublabel,
}: MetricCardProps) {
  const content = (
    <div
      className={cn(
        "border rounded-xl p-5 transition-all duration-150",
        href && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
        variant === "income" && "border-income/30 bg-income/5",
        variant === "expense" && "border-expense/30 bg-expense/5",
        variant === "default" && "border-border bg-card",
        value < 0 && variant === "default" && "border-expense/30 bg-expense/5"
      )}
    >
      <p
        className={cn(
          "text-xs uppercase tracking-wider font-mono mb-3 truncate",
          variant === "income" ? "text-income" : variant === "expense" ? "text-expense" : "text-muted-foreground"
        )}
      >
        {label}
      </p>

      {empty ? (
        <p className="text-sm text-muted-foreground underline underline-offset-4 decoration-dashed">
          {emptyHint}
        </p>
      ) : (
        <>
          <div
            className={cn(
              "text-2xl font-medium tabular-nums",
              variant === "income" && "text-income",
              variant === "expense" && "text-expense",
              variant === "default" && value < 0 && "text-expense",
              variant === "default" && value >= 0 && "text-foreground"
            )}
          >
            {prefix}
            <NumberFlow
              value={value}
              format={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }}
              locales="es-AR"
            />
            {suffix}
          </div>
          {sublabel && (
            <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
          )}
        </>
      )}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
