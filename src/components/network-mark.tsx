import { CC0_MARKS } from "@/components/marks/cc0-marks";
import type { CardNetwork } from "@/lib/types";
import { cn } from "@/lib/utils";

function glossId(id: string): string {
  return `emboss-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/** Wordmark gigante, más claro que la base, recortado por el borde de la cara. */
export function EmbossedNetwork({ network, id }: { network: CardNetwork; id: string }) {
  const grad = glossId(id);
  const gloss = (
    <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.62" />
      <stop offset="0.46" stopColor="#ffffff" stopOpacity="0.2" />
      <stop offset="1" stopColor="#ffffff" stopOpacity="0.4" />
    </linearGradient>
  );

  if (network === "mastercard") {
    return (
      <svg viewBox="0 0 680 150" className="pointer-events-none absolute top-[9%] left-[2%] h-[36%] w-[124%]" aria-hidden>
        <defs>{gloss}</defs>
        <text
          x="0"
          y="124"
          fill={`url(#${grad})`}
          fontSize="132"
          fontWeight="500"
          fontFamily="var(--font-geist-sans), ui-sans-serif, sans-serif"
          style={{ letterSpacing: "-0.045em" }}
        >
          mastercard
        </text>
      </svg>
    );
  }

  if (network === "amex") {
    return (
      <svg viewBox="0 0 520 170" className="pointer-events-none absolute top-[6%] left-[6%] h-[50%] w-[132%]" aria-hidden>
        <defs>{gloss}</defs>
        <text
          x="0"
          y="142"
          fill={`url(#${grad})`}
          fontSize="156"
          fontWeight="700"
          fontFamily="var(--font-geist-sans), ui-sans-serif, sans-serif"
          style={{ letterSpacing: "-0.04em" }}
        >
          AMEX
        </text>
      </svg>
    );
  }

  const visa = CC0_MARKS.visa;
  return (
    <svg
      viewBox={visa.viewBox}
      className="pointer-events-none absolute top-[8%] -right-[22%] h-[50%] w-auto"
      aria-hidden
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="8" x2="0" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.58" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.36" />
        </linearGradient>
      </defs>
      <path d={visa.path} fill={`url(#${grad})`} />
    </svg>
  );
}

/**
 * Logos de red, alineados por la base y el borde derecho.
 * Visa: silueta CC0 de simple-icons.
 * Mastercard: dos círculos propios y la lente del medio.
 * Amex: wordmark de dos líneas, sin pastilla. Sobre el metal va en blanco.
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
      <svg viewBox="0 0 152 100" className={cn("h-[22px] w-auto", className)} aria-hidden>
        <circle cx="50" cy="50" r="50" fill="#EB001B" />
        <circle cx="102" cy="50" r="50" fill="#F79E1B" />
        <path d="M76 7.292A50 50 0 0 0 76 92.708A50 50 0 0 0 76 7.292Z" fill="#FF5F00" />
      </svg>
    );
  }

  if (network === "amex") {
    const fill = tone === "on-dark" ? "#ffffff" : "#2E77BC";
    return (
      <svg viewBox="0 0 86 28" className={cn("h-7 w-auto", className)} aria-hidden>
        <text
          x="86"
          y="12"
          textAnchor="end"
          fill={fill}
          fontSize="9"
          fontWeight="700"
          fontFamily="var(--font-geist-sans), ui-sans-serif, sans-serif"
          style={{ letterSpacing: "0.04em" }}
        >
          AMERICAN
        </text>
        <text
          x="86"
          y="26"
          textAnchor="end"
          fill={fill}
          fontSize="9"
          fontWeight="700"
          fontFamily="var(--font-geist-sans), ui-sans-serif, sans-serif"
          style={{ letterSpacing: "0.12em" }}
        >
          EXPRESS
        </text>
      </svg>
    );
  }

  const visa = CC0_MARKS.visa;
  const fill = tone === "on-dark" ? "#ffffff" : visa.hex;
  return (
    <svg viewBox={visa.viewBox} className={cn("h-4 w-auto", className)} aria-hidden>
      <path d={visa.path} fill={fill} />
    </svg>
  );
}
