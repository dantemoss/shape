"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { Ellipsis, Info } from "lucide-react";
import { formatMoney, normalizeCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";

const FLOW_TIMING = { duration: 250, easing: "ease-out" } as const;

/** Círculo neutro. El ícono va oscuro; el color de categoría es un punto aparte. */
export const iconWellClass =
  "flex shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-[#f4f5f7] text-[#1c1f26]";

const WELL_SIZE = {
  sm: "size-7",
  md: "size-9",
  lg: "size-10",
} as const;

export function IconWell({
  children,
  className,
  size = "md",
}: {
  children: ReactNode;
  className?: string;
  size?: keyof typeof WELL_SIZE;
}) {
  return <span className={cn(iconWellClass, WELL_SIZE[size], className)}>{children}</span>;
}

export function CategoryDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("size-1.5 shrink-0 rounded-full", className)}
      style={{ background: color }}
    />
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[12px] font-medium text-[#1c1f26]",
        className
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

export type AmountTone = "income" | "expense" | "neutral" | "auto";

export function Amount({
  value,
  currency = "ARS",
  tone = "neutral",
  signed = false,
  animate = false,
  className,
}: {
  value: number;
  currency?: string | null;
  tone?: AmountTone;
  signed?: boolean;
  /** NumberFlow. Solo en el hero y en totales, no en cada fila. */
  animate?: boolean;
  className?: string;
}) {
  const resolved: Exclude<AmountTone, "auto"> =
    tone === "auto" ? (value < 0 ? "expense" : value > 0 ? "income" : "neutral") : tone;
  const abs = Math.abs(value);
  const code = normalizeCurrency(currency);
  const sign = signed || value < 0 ? (resolved === "income" && value >= 0 ? "+" : "−") : "";
  const digits = Math.abs(abs - Math.round(abs)) < 0.001 ? 0 : 2;
  const canFlow = animate && (code === "ARS" || code === "USD");
  const prefix = `${sign}${code === "USD" ? "US$" : "$"}`;
  return (
    <span
      className={cn(
        "tabular-nums",
        resolved === "income" && "text-income",
        resolved === "expense" && "text-expense",
        resolved === "neutral" && "text-[#1c1f26]",
        className
      )}
    >
      {canFlow ? (
        <NumberFlow
          value={abs}
          locales="es-AR"
          format={{ minimumFractionDigits: digits, maximumFractionDigits: digits }}
          prefix={prefix}
          respectMotionPreference
          transformTiming={FLOW_TIMING}
          spinTiming={FLOW_TIMING}
          opacityTiming={{ duration: 200, easing: "ease-out" }}
        />
      ) : (
        <>
          {sign}
          {formatMoney(abs, currency)}
        </>
      )}
    </span>
  );
}

const STAT_SIZE = {
  sm: "text-[clamp(0.82rem,3.2vw,1rem)]",
  md: "num text-[clamp(1.25rem,5vw,1.7rem)]",
  lg: "num text-[clamp(1.7rem,6.4vw,2.55rem)] leading-none",
} as const;

export function Stat({
  label,
  value,
  hint,
  tone,
  size = "sm",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: string;
  size?: keyof typeof STAT_SIZE;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[13px] text-[#9aa1ab]">{label}</p>
      <p className={cn("mt-1 truncate font-semibold tracking-tight tabular-nums", STAT_SIZE[size], tone ?? "text-[#1c1f26]")}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 truncate text-[13px] text-[#6d7480]">{hint}</p> : null}
    </div>
  );
}

export function StatRow({
  children,
  columns = 3,
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const cols = columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-3";
  return <div className={cn("grid gap-3", cols, className)}>{children}</div>;
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("viz-card flex h-full min-h-0 flex-col", className)}>
      {title ? (
        <header className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-semibold tracking-[-0.03em] text-[#1c1f26]">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-[13px] leading-snug text-[#9aa1ab]">{subtitle}</p> : null}
          </div>
          {action ? <div className="ml-auto shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}

export type CardMenuItem = {
  label: string;
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
};

export function CardMenu({ label = "Más opciones", items }: { label?: string; items: CardMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="flex size-9 items-center justify-center rounded-full bg-[#f5f6f8] text-[#a0a6b0] ring-1 ring-black/[0.04]"
      >
        <Ellipsis size={16} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-11 right-0 z-30 w-56 rounded-2xl bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.06]"
        >
          {items.map((item) => {
            const className =
              "block w-full rounded-xl px-3 py-2.5 text-left text-[14px] text-[#1c1f26] hover:bg-[#f6f7f9] disabled:opacity-40";
            if (item.href) {
              return (
                <Link key={item.label} href={item.href} role="menuitem" className={className} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={className}
                onClick={() => {
                  setOpen(false);
                  item.onSelect?.();
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function InfoTip({ text, label = "Más información" }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const shown = open || hover;

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <span
      ref={ref}
      className="relative"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHover(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setHover(false);
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={shown}
        onClick={() => setOpen((value) => !value)}
        className="flex size-6 items-center justify-center rounded-full border border-black/[0.06] bg-[#f4f5f7] text-[#1c1f26]"
      >
        <Info size={13} />
      </button>
      {shown ? (
        <span className="absolute top-8 left-0 z-30 w-[min(18rem,calc(100vw-3rem))] rounded-2xl bg-white p-3 text-[13px] leading-relaxed text-[#3a4150] shadow-[0_12px_32px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.06]">
          {text}
        </span>
      ) : null}
    </span>
  );
}

export function SegmentedControl<T extends string>({
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
              selected ? "bg-white text-[#1c1f26] shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "text-[#8d949e]"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ListRow({
  icon,
  title,
  meta,
  amount,
  trailing,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  amount?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      {icon}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-[#1c1f26]">{title}</p>
        {meta ? <p className="truncate text-[12px] text-[#9aa1ab]">{meta}</p> : null}
      </div>
      {amount ? <div className="shrink-0 text-right text-[14px] font-semibold">{amount}</div> : null}
      {trailing ? <div className="flex shrink-0 items-center gap-1">{trailing}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
  icon,
  className,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl bg-[#f7f8fa] px-6 py-12 text-center", className)}>
      {icon ? <div className="mb-3">{icon}</div> : null}
      <p className="text-[14px] font-medium text-[#1c1f26]">{title}</p>
      {children ? <div className="mt-1 max-w-xs text-[13px] leading-relaxed text-[#8d949e]">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="min-w-0">
        <h1 className="truncate text-[1.35rem] font-semibold tracking-[-0.03em]">{title}</h1>
        {subtitle ? <div className="text-[13px] text-[#9aa1ab]">{subtitle}</div> : null}
      </div>
      {action}
    </header>
  );
}

export const pageStackClass = "mx-auto w-full min-w-0 max-w-6xl px-4 py-4 sm:px-6 sm:py-6";
