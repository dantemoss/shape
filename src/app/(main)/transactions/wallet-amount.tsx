import { cn } from "@/lib/utils";
import { walletParts } from "./logic";

/**
 * Cifra de billetera. El entero lleva el tamaño pedido;
 * el signo, el símbolo y los centavos van más chicos y más claros.
 * Sin ",00". Local hasta que Amount en las primitivas compartidas lo cubra.
 */
const SCALE = {
  /** Gastado de la tira. */
  strip: { main: "text-[28px] leading-none", minor: "text-[18px]" },
  /** Cantidad no usa esto. Por día en la tira. */
  stat: { main: "text-[22px] leading-none", minor: "text-[14px]" },
  /** Total del día. */
  day: { main: "text-[16px] leading-none", minor: "text-[13px]" },
  /** Monto de la fila. */
  row: { main: "text-[16px] leading-none", minor: "text-[13px]" },
} as const;

export function WalletAmount({
  value,
  currency,
  size,
  tone = "neutral",
  className,
  amountName,
}: {
  value: number;
  currency: "ARS" | "USD";
  size: keyof typeof SCALE;
  tone?: "neutral" | "income" | "muted";
  className?: string;
  amountName?: string;
}) {
  const parts = walletParts(value, currency);
  const scale = SCALE[size];
  return (
    <span
      data-amount={amountName}
      className={cn(
        "inline-block whitespace-nowrap font-semibold tabular-nums",
        scale.main,
        tone === "income" && "text-[#1f9d55]",
        tone === "neutral" && "text-[#1c1f26]",
        tone === "muted" && "text-[#8b919c]",
        className
      )}
    >
      <span className={cn("align-baseline font-medium text-[#8b919c]", scale.minor, tone === "income" && "text-[#1f9d55]/70")}>
        {parts.sign}
        {parts.symbol}
      </span>
      <span className="align-baseline">{parts.integer}</span>
      {parts.fraction ? (
        <span className={cn("align-baseline font-medium text-[#8b919c]", scale.minor, tone === "income" && "text-[#1f9d55]/70")}>
          {parts.fraction}
        </span>
      ) : null}
    </span>
  );
}
