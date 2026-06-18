"use client";

import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";

interface DonutRingProps {
  percentage: number;
  color: string;
  size?: number;
  stroke?: number;
}

function DonutRing({ percentage, color, size = 80, stroke = 8 }: DonutRingProps) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      {/* Track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-border"
      />
      {/* Fill */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

interface BalanceCardProps {
  title: string;
  subtitle: string;
  value: number;
  percentage: number;
  changePercent?: number;
  color: "income" | "expense" | "neutral";
  href?: string;
  empty?: boolean;
  emptyHint?: string;
}

export function BalanceCard({
  title,
  subtitle,
  value,
  percentage,
  changePercent,
  color,
  href,
  empty,
  emptyHint,
}: BalanceCardProps) {
  const ringColor =
    color === "income"
      ? "oklch(0.55 0.15 162)"
      : color === "expense"
      ? "oklch(0.577 0.245 27.325)"
      : "oklch(0.439 0 0)";

  const content = (
    <div
      className={cn(
        "border border-border rounded-2xl p-6 bg-card transition-all duration-150",
        href && "hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        {changePercent !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
              changePercent >= 0
                ? "text-income bg-income/10"
                : "text-expense bg-expense/10"
            )}
          >
            {changePercent >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {changePercent >= 0 ? "+" : ""}{Math.round(changePercent)}%
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex items-center gap-4">
        <DonutRing percentage={percentage} color={ringColor} size={76} stroke={7} />
        <div>
          <p className="text-xs text-muted-foreground mb-1">Saldo actual</p>
          {empty ? (
            <p className="text-sm text-muted-foreground underline underline-offset-4 decoration-dashed">
              {emptyHint}
            </p>
          ) : (
            <p
              className={cn(
                "text-2xl font-bold tabular-nums leading-none",
                color === "income" ? "text-income" : color === "expense" ? "text-expense" : "text-foreground"
              )}
            >
              $<NumberFlow
                value={value}
                format={{ maximumFractionDigits: 0 }}
                locales="es-AR"
              />
            </p>
          )}
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {Math.round(percentage)}% del sueldo
          </p>
        </div>
      </div>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
