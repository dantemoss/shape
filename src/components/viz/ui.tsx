"use client";

import Link from "next/link";
import { Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChartCard({
  title,
  subtitle,
  href,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("viz-card", className)}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-semibold tracking-[-0.03em] text-[#1c1f26]">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-[13px] leading-snug text-[#9aa1ab]">{subtitle}</p> : null}
        </div>
        <div className="ml-auto shrink-0">{action ?? (href ? <DotLink href={href} /> : null)}</div>
      </header>
      {children}
    </section>
  );
}

export function DotLink({ href, label = "Más opciones" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f5f6f8] text-[#a0a6b0] ring-1 ring-black/[0.04] transition-colors hover:text-[#1c1f26]"
    >
      <Ellipsis size={16} />
    </Link>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full rounded-full bg-[#f2f3f5] p-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-8 rounded-full px-3 text-[13px] font-medium transition-all",
              selected
                ? "bg-white text-[#1c1f26] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                : "text-[#8d949e]"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function HoverTip({
  rows,
}: {
  rows: { swatch: string; value: string; hint?: string }[];
}) {
  return (
    <div className="pointer-events-none rounded-[16px] bg-white px-3 py-2 shadow-[0_10px_28px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.05]">
      {rows.map((row) => (
        <div key={`${row.value}-${row.hint ?? ""}`} className="flex items-center gap-2 py-[3px]">
          <span className="h-4 w-[3px] shrink-0 rounded-full" style={{ background: row.swatch }} />
          <span className="text-[13px] font-semibold tracking-[-0.02em] text-[#1c1f26] tabular-nums">{row.value}</span>
          {row.hint ? <span className="text-[12px] text-[#9aa1ab]">{row.hint}</span> : null}
        </div>
      ))}
    </div>
  );
}

export function TipAnchor({
  left,
  top,
  children,
}: {
  left: string;
  top: string;
  children: React.ReactNode;
}) {
  const numeric = Number.parseFloat(left);
  const shift = numeric > 64 ? "-100%" : numeric < 28 ? "0%" : "-50%";
  return (
    <div
      className="pointer-events-none absolute z-10 max-w-[calc(100%-8px)]"
      style={{ left, top, transform: `translate(${shift}, 0)` }}
    >
      {children}
    </div>
  );
}

export function EmptyChart({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl bg-[#f7f8fa] px-6 text-center text-[13px] leading-relaxed text-[#8d949e]">
      {children}
    </div>
  );
}

/** Alto fijo: el viewBox no puede crecer con el ancho de la pantalla. */
export const chartPlotClass = "mx-auto block h-[188px] w-full max-w-[640px] sm:h-[206px]";

/** Círculo neutro. El ícono va oscuro; el color de categoría es un punto aparte. */
export const iconWell =
  "flex size-9 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-[#f4f5f7] text-[#1c1f26]";

export function HeroNumber({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("num text-[clamp(1.7rem,6.4vw,2.55rem)] leading-none text-[#16181d]", className)}>
      {children}
    </p>
  );
}

export function DeltaPill({ value, positiveIsGood = true }: { value: number; positiveIsGood?: boolean }) {
  const good = positiveIsGood ? value >= 0 : value <= 0;
  const text = `${value > 0.05 ? "+" : value < -0.05 ? "−" : ""}${Math.abs(value).toLocaleString("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums",
        good ? "bg-[#e8f8ef] text-[#1f9d55]" : "bg-[#fdecec] text-[#e5484d]"
      )}
    >
      {text}
    </span>
  );
}
