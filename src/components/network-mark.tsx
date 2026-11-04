import { CC0_MARKS } from "@/components/marks/cc0-marks";
import type { CardNetwork } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Logos de red. Visa y American Express usan la silueta CC0 de simple-icons.
 * Mastercard es geometría propia: dos círculos de radio 50 con centros a 52 px
 * y la lente naranja del solapamiento. Colores públicos de la marca.
 */
export function NetworkMark({
  network,
  tone = "on-dark",
  className,
}: {
  network: CardNetwork;
  tone?: "on-dark" | "on-light";
  className?: string;
}) {
  if (network === "mastercard") {
    return (
      <svg viewBox="0 0 152 100" className={cn("h-7 w-auto", className)} aria-hidden>
        <circle cx="50" cy="50" r="50" fill="#EB001B" />
        <circle cx="102" cy="50" r="50" fill="#F79E1B" />
        <path
          d="M76 7.292A50 50 0 0 0 76 92.708A50 50 0 0 0 76 7.292Z"
          fill="#FF5F00"
        />
      </svg>
    );
  }

  const slug = network === "amex" ? "americanexpress" : "visa";
  const mark = CC0_MARKS[slug];
  const fill = tone === "on-dark" ? "#ffffff" : mark.hex;
  return (
      <svg viewBox={mark.viewBox} className={cn(network === "amex" ? "h-10 w-10" : "h-[18px] w-auto", className)} aria-hidden>
      <path d={mark.path} fill={fill} />
    </svg>
  );
}
