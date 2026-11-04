"use client";

import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { NetworkMark } from "@/components/network-mark";
import { ISSUERS, type CreditCard } from "@/lib/types";
import { logoUrl } from "@/lib/logodev";
import { cn } from "@/lib/utils";

function LogoImg({
  domain,
  alt,
  size = 32,
  className,
  fallback,
}: {
  domain: string;
  alt: string;
  size?: number;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [errored, setErrored] = useState(false);
  if (!domain || errored) return <>{fallback}</>;
  return (
    <img
      src={logoUrl(domain, size)}
      alt={alt}
      width={size}
      height={size}
      className={cn("object-contain", className)}
      onError={() => setErrored(true)}
    />
  );
}

export function IssuerAvatar({
  issuerKey,
  size = "md",
}: {
  issuerKey: string;
  size?: "sm" | "md" | "lg";
}) {
  const info = ISSUERS[issuerKey] ?? ISSUERS.otro;
  const px = { sm: 24, md: 32, lg: 40 }[size];
  const cls = { sm: "size-6", md: "size-8", lg: "size-10" }[size];
  const textCls = { sm: "text-[9px]", md: "text-[11px]", lg: "text-xs" }[size];

  const fallback = (
    <span
      className={cn("flex size-full items-center justify-center rounded-lg font-medium leading-none", textCls)}
      style={{ background: info.color, color: info.textColor }}
    >
      {info.abbr}
    </span>
  );

  if (!info.domain) {
    return <span className={cn("inline-flex shrink-0 overflow-hidden rounded-lg", cls)}>{fallback}</span>;
  }

  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", cls)}>
      <LogoImg domain={info.domain} alt={info.name} size={px * 2} className="size-full object-contain logo-light" fallback={fallback} />
    </span>
  );
}

function CardChip({ id }: { id: string }) {
  const shade = `chip-shade-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg width="34" height="26" viewBox="0 0 34 26" aria-hidden className="shrink-0">
      <rect width="34" height="26" rx="4" fill="#d7c29a" />
      <rect x="0" y="0" width="34" height="26" rx="4" fill={`url(#${shade})`} />
      <path d="M12 0v26M22 0v26M0 9h34M0 17h34" stroke="#b89a62" strokeWidth="0.6" />
      <rect x="12" y="9" width="10" height="8" rx="1" fill="#c6ad78" stroke="#a88b55" strokeWidth="0.4" />
      <defs>
        <linearGradient id={shade} x1="0" y1="0" x2="34" y2="26">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function MetalCardFace({ card }: { card: CreditCard }) {
  const issuer = ISSUERS[card.issuerKey] ?? ISSUERS.otro;
  const ref = useRef<HTMLDivElement>(null);
  const name = card.label.trim() || issuer.name;
  const last4 = card.lastFourDigits?.slice(-4) || "····";

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const node = ref.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const x = ((event.clientX - box.left) / box.width) * 100;
    const y = ((event.clientY - box.top) / box.height) * 100;
    node.style.setProperty("--px", `${x}%`);
    node.style.setProperty("--py", `${y}%`);
  }

  return (
    <div
      ref={ref}
      className="metal-face relative aspect-[1.586/1] w-full overflow-hidden rounded-[18px] text-white"
      style={{ "--tint": card.color || issuer.color } as CSSProperties}
      onPointerMove={onPointerMove}
    >
      <div className="metal-sheen" aria-hidden />
      <div className="relative flex h-full min-w-0 flex-col justify-between p-4 sm:p-5">
        <p className="min-w-0 truncate pr-11 text-[15px] font-medium leading-tight tracking-[-0.02em]">{name}</p>
        <div className="mt-3">
          <CardChip id={card.id} />
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <p className="min-w-0 text-[15px] tracking-[0.22em] tabular-nums">{last4}</p>
          <NetworkMark network={card.network} tone="on-dark" />
        </div>
      </div>
    </div>
  );
}
