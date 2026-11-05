"use client";

import { Amount, type AmountTone } from "@/components/primitives";
import { formatSignedPercent } from "@/lib/chart-format";

export const CHART_MS = 240;

/** Alto fijo: el contenedor de shadcn trae aspect-video y un tope de ancho. Acá no. */
export const chartPlotClass = "aspect-auto h-full min-h-[220px] w-full max-w-none";

export function ChartPlot({
  label,
  children,
  className = "min-h-[220px]",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={`flex w-full flex-1 flex-col ${className}`}>
      {children}
    </div>
  );
}

export type TipRow = {
  swatch: string;
  value: number;
  hint?: string;
  tone?: AmountTone;
};

type PayloadItem = {
  payload?: Record<string, unknown>;
};

/** Misma ficha que HoverTip: barra, monto con Amount y una pista. */
export function ShapeTooltipContent({
  active,
  payload,
  rows,
}: {
  active?: boolean;
  payload?: PayloadItem[];
  rows: (point: Record<string, unknown>) => TipRow[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;
  const lines = rows(point).filter((row) => Number.isFinite(row.value));
  if (lines.length === 0) return null;
  return (
    <div role="status" aria-live="polite" className="pointer-events-none rounded-[16px] bg-white px-3 py-2 shadow-[0_10px_28px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.05]">
      {lines.map((row) => (
        <div key={`${row.hint ?? "valor"}-${row.swatch}`} className="flex items-center gap-2 py-[3px]">
          <span className="h-4 w-[3px] shrink-0 rounded-full" style={{ background: row.swatch }} />
          <Amount value={row.value} size="secondary" tone={row.tone ?? "neutral"} className="text-[13px]" />
          {row.hint ? <span className="text-[12px] text-[#9aa1ab]">{row.hint}</span> : null}
        </div>
      ))}
    </div>
  );
}

export function SignedPercent({ value, positiveIsGood = true }: { value: number; positiveIsGood?: boolean }) {
  const good = positiveIsGood ? value >= 0 : value <= 0;
  return (
    <span className={good ? "text-[13px] font-semibold tabular-nums text-income" : "text-[13px] font-semibold tabular-nums text-expense"}>
      {formatSignedPercent(value)}
    </span>
  );
}
