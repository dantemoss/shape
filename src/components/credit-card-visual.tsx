"use client";

import { useState } from "react";
import { CreditCard, CardInstallment, ISSUERS } from "@/lib/types";
import { logoUrl, NETWORK_DOMAINS } from "@/lib/logodev";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/* ── Logo helpers ─────────────────────────────────────────── */

function LogoImg({
  domain,
  alt,
  size = 32,
  className,
  style,
  fallback,
}: {
  domain: string;
  alt: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
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
      style={style}
      onError={() => setErrored(true)}
    />
  );
}

/* ── Network logos — SVGs propios para garantizar calidad ─── */
function NetworkLogo({ network }: { network: string }) {
  if (network === "visa") {
    return (
      <svg viewBox="0 0 152 48" className="h-7 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M63.5 3L48.5 45H37L52 3H63.5Z" fill="white"/>
        <path d="M108.5 3.9C106.1 3 102.3 2 97.6 2C86.4 2 78.5 7.8 78.4 16.1C78.3 22.2 83.9 25.6 88.1 27.6C92.4 29.7 93.8 31 93.8 32.8C93.7 35.6 90.4 36.9 87.3 36.9C82.9 36.9 80.6 36.2 76.9 34.6L75.5 33.9L74 43.5C76.8 44.8 82.1 45.9 87.6 46C99.5 46 107.2 40.3 107.3 31.4C107.4 26.5 104.3 22.8 97.6 19.8C93.8 17.9 91.5 16.6 91.5 14.7C91.5 13 93.4 11.2 97.6 11.2C101.1 11.1 103.7 11.9 105.7 12.7L106.7 13.2L108.5 3.9Z" fill="white"/>
        <path d="M125.5 3H116.3C113.6 3 111.5 3.8 110.3 6.6L93.5 45H105.4C105.4 45 107.3 39.9 107.7 38.9C109 38.9 120.5 38.9 122.2 38.9C122.6 40.2 123.7 45 123.7 45H134.2L125.5 3ZM110.9 30.2C111.9 27.6 115.7 17.3 115.7 17.3C115.6 17.5 116.7 14.7 117.3 12.9L118.1 16.9C118.1 16.9 120.5 27.5 121 30.2H110.9Z" fill="white"/>
        <path d="M27.5 3L16.5 31.7L15.3 25.6C13.3 18.8 7.1 11.4 0.2 7.7L10.3 45H22.3L40.5 3H27.5Z" fill="white"/>
      </svg>
    );
  }
  if (network === "mastercard") {
    return (
      <svg viewBox="0 0 50 32" className="h-8 w-auto" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#EB001B" opacity="0.95"/>
        <circle cx="34" cy="16" r="16" fill="#F79E1B" opacity="0.95"/>
        <path d="M25 6.9A16.07 16.07 0 0 1 31.1 16 16.07 16.07 0 0 1 25 25.1 16.07 16.07 0 0 1 18.9 16 16.07 16.07 0 0 1 25 6.9z" fill="#FF5F00"/>
      </svg>
    );
  }
  if (network === "amex") {
    return (
      <svg viewBox="0 0 80 24" className="h-6 w-auto" fill="white" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="20" fontSize="22" fontWeight="600" fontFamily="Arial, sans-serif" letterSpacing="-0.5">AMEX</text>
      </svg>
    );
  }
  return null;
}

/* ── Issuer avatar (sidebar list, card detail) ─────────────── */
export function IssuerAvatar({
  issuerKey,
  size = "md",
  onDark = false,
}: {
  issuerKey: string;
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
}) {
  const info = ISSUERS[issuerKey] ?? ISSUERS.otro;
  const px = { sm: 24, md: 32, lg: 40 }[size];
  const cls = { sm: "w-6 h-6", md: "w-8 h-8", lg: "w-10 h-10" }[size];
  const textCls = { sm: "text-[9px]", md: "text-[11px]", lg: "text-xs" }[size];

  const fallback = (
    <div
      className={cn("w-full h-full flex items-center justify-center font-medium leading-none rounded-lg", textCls)}
      style={{ background: info.color, color: info.textColor }}
    >
      {info.abbr}
    </div>
  );

  if (!info.domain) {
    return <div className={cn("rounded-lg shrink-0 overflow-hidden", cls)}>{fallback}</div>;
  }

  return (
    <div className={cn("shrink-0 flex items-center justify-center", cls)}>
      <LogoImg
        domain={info.domain}
        alt={info.name}
        size={px * 2}
        className={cn("w-full h-full object-contain", onDark ? "logo-dark" : "logo-light")}
        fallback={fallback}
      />
    </div>
  );
}

/* ── Card chip ─────────────────────────────────────────────── */
function ChipIcon() {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
      <rect width="36" height="28" rx="4" fill="rgba(255,255,255,0.25)" />
      <rect x="12" y="0" width="12" height="28" fill="rgba(255,255,255,0.12)" />
      <rect y="8" width="36" height="12" fill="rgba(255,255,255,0.12)" />
      <rect x="14" y="2" width="8" height="24" rx="1" fill="rgba(255,255,255,0.06)" />
    </svg>
  );
}

/* ── Main card visual ──────────────────────────────────────── */
interface CreditCardVisualProps {
  card: CreditCard;
  installments: CardInstallment[];
  onRemove?: (id: string) => void;
  compact?: boolean;
}

export function CreditCardVisual({ card, installments, onRemove, compact }: CreditCardVisualProps) {
  const issuer = ISSUERS[card.issuerKey] ?? ISSUERS.otro;
  const bgColor = card.color ?? issuer.color;
  const available = card.creditLimit - card.usedAmount;
  const usedPct = card.creditLimit > 0 ? Math.min((card.usedAmount / card.creditLimit) * 100, 100) : 0;
  const activeInstallments = installments.filter((i) => i.paidInstallments < i.totalInstallments);
  const totalMonthlyInstallments = activeInstallments.reduce(
    (sum, i) => sum + i.totalAmount / i.totalInstallments,
    0
  );

  const cardBg = `linear-gradient(135deg, ${bgColor}f0 0%, ${bgColor}b0 60%, ${bgColor}80 100%)`;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
        <IssuerAvatar issuerKey={card.issuerKey} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{card.label}</p>
          <p className="text-[10px] text-muted-foreground font-mono">
            {card.network.toUpperCase()}
            {card.lastFourDigits ? ` •••• ${card.lastFourDigits}` : ""}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-muted-foreground">Disponible</p>
          <p className={cn("text-sm font-mono", available >= 0 ? "text-income" : "text-expense")}>
            ${available.toLocaleString("es-AR")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Tarjeta física ── */}
      <div
        className="relative w-full rounded-2xl p-6 overflow-hidden select-none"
        style={{
          background: cardBg,
          minHeight: 200,
          boxShadow: `0 20px 60px ${bgColor}50, 0 4px 16px rgba(0,0,0,0.18)`,
        }}
      >
        {/* Noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Remove button */}
        {onRemove && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={() => onRemove(card.id)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors z-10"
                />
              }
            >
              <Trash2 size={12} className="text-white/80" />
            </TooltipTrigger>
            <TooltipContent>Eliminar tarjeta</TooltipContent>
          </Tooltip>
        )}

        {/* Top: issuer logo + network logo */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {/* Issuer logo — frosted pill para que el fondo del logo quede integrado */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/90 backdrop-blur-sm flex items-center justify-center p-1.5 shadow-sm">
              {issuer.domain ? (
                <img
                  src={logoUrl(issuer.domain, 64)}
                  alt={issuer.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs font-medium" style={{ color: issuer.color }}>{issuer.abbr}</span>
              )}
            </div>
            <div>
              <p className="text-white/50 text-[9px] uppercase tracking-widest leading-none mb-0.5">
                {issuer.type === "fintech" ? "Fintech" : "Banco"}
              </p>
              <p className="text-white text-sm font-medium leading-none">{issuer.name}</p>
            </div>
          </div>
          <NetworkLogo network={card.network} />
        </div>

        {/* Chip */}
        <div className="mb-4">
          <ChipIcon />
        </div>

        {/* Card number */}
        <p className="text-white/75 text-sm font-mono tracking-[0.22em] mb-4">
          •••• •••• •••• {card.lastFourDigits ?? "••••"}
        </p>

        {/* Bottom: label + available */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Titular</p>
            <p className="text-white text-sm font-medium">{card.label}</p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Disponible</p>
            <p className="text-white text-xl font-medium font-mono">
              ${available.toLocaleString("es-AR")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 divide-x divide-border border border-border rounded-xl overflow-hidden">
        <div className="p-3.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-1">Límite</p>
          <p className="text-sm font-medium font-mono">${card.creditLimit.toLocaleString("es-AR")}</p>
        </div>
        <div className="p-3.5">
          <p className="text-[10px] text-expense uppercase tracking-wider font-mono mb-1">Usado</p>
          <p className="text-sm font-medium font-mono text-expense">${card.usedAmount.toLocaleString("es-AR")}</p>
        </div>
        <div className="p-3.5">
          <p className="text-[10px] text-income uppercase tracking-wider font-mono mb-1">Disponible</p>
          <p className={cn("text-sm font-medium font-mono", available >= 0 ? "text-income" : "text-expense")}>
            ${Math.abs(available).toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      {/* ── Barra de uso ── */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>Uso del límite</span>
          <span className={cn(usedPct >= 80 ? "text-expense" : usedPct >= 60 ? "text-yellow-600" : "text-income")}>
            {Math.round(usedPct)}%
          </span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${usedPct}%`,
              background:
                usedPct >= 80
                  ? "oklch(0.577 0.245 27.325)"
                  : usedPct >= 60
                  ? "#d97706"
                  : "oklch(0.55 0.15 162)",
            }}
          />
        </div>
      </div>

      {/* ── Cuotas activas (resumen) ── */}
      {activeInstallments.length > 0 && (
        <div className="border border-border rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Cuotas activas</p>
            <span className="text-[10px] font-mono text-muted-foreground">
              ~${Math.round(totalMonthlyInstallments).toLocaleString("es-AR")}/mes
            </span>
          </div>
          {activeInstallments.map((inst) => {
            const remaining = inst.totalInstallments - inst.paidInstallments;
            const pct = (inst.paidInstallments / inst.totalInstallments) * 100;
            return (
              <div key={inst.id}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground truncate max-w-[60%]">{inst.description}</span>
                  <span className="font-mono text-muted-foreground">{remaining} restantes</span>
                </div>
                <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-income" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
