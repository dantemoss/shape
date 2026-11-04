"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { EmbossedNetwork, NetworkMark } from "@/components/network-mark";
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

function CardChip() {
  return <span className="card-chip" aria-hidden />;
}

export function MetalCardFace({ card }: { card: CreditCard }) {
  const ref = useRef<HTMLDivElement>(null);
  const last4 = card.lastFourDigits?.slice(-4) || "····";

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const node = ref.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const x = ((event.clientX - box.left) / box.width) * 100;
    node.style.setProperty("--px", `${x}%`);
  }

  return (
    <div
      ref={ref}
      className={cn(
        "card-face relative aspect-[1.586/1] w-full max-w-[360px] overflow-hidden text-white",
        card.network === "mastercard" ? "card-face-mastercard" : card.network === "amex" ? "card-face-amex" : "card-face-visa"
      )}
      onPointerMove={onPointerMove}
    >
      <EmbossedNetwork network={card.network} id={card.id} />
      <div className="card-sheen" aria-hidden />
      <CardChip />
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 px-4 pb-3.5 sm:px-5">
        <p className="text-[12px] font-medium tracking-[0.08em] text-white/85">{`**** ${last4}`}</p>
        <span className="flex h-7 shrink-0 items-end justify-end">
          <NetworkMark network={card.network} tone="on-dark" />
        </span>
      </div>
    </div>
  );
}
