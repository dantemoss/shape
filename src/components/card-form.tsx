"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShapeStore } from "@/lib/store";
import { ISSUERS, type CardNetwork, type CreditCard } from "@/lib/types";
import { logoUrl } from "@/lib/logodev";
import { IssuerAvatar } from "@/components/credit-card-visual";
import { NetworkMark } from "@/components/network-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

const NETWORKS: { key: CardNetwork; label: string }[] = [
  { key: "visa", label: "Visa" },
  { key: "mastercard", label: "Mastercard" },
  { key: "amex", label: "Amex" },
];

const BANK_ISSUERS = Object.entries(ISSUERS).filter(([, v]) => v.type === "bank");
const FINTECH_ISSUERS = Object.entries(ISSUERS).filter(([, v]) => v.type === "fintech");

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-1.5 justify-center mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={cn("h-1 rounded-full transition-all duration-300", i === current ? "w-5 bg-foreground" : "w-1.5 bg-border")} />
      ))}
    </div>
  );
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

interface CardFormProps {
  onSuccess?: () => void;
  card?: CreditCard;
}

function dayValue(value: number | null | undefined): string {
  return value ? String(value) : "";
}

function parseMoney(value: string): number {
  return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
}

function parseDay(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 31) return null;
  return parsed;
}

export function CardForm({ onSuccess, card }: CardFormProps) {
  const addCreditCard = useShapeStore((s) => s.addCreditCard);
  const updateCreditCard = useShapeStore((s) => s.updateCreditCard);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const [network, setNetwork] = useState<CardNetwork>(card?.network ?? "visa");
  const [issuerKey, setIssuerKey] = useState(card?.issuerKey ?? "otro");
  const [label, setLabel] = useState(card?.label ?? "");
  const [lastFour, setLastFour] = useState(card?.lastFourDigits ?? "");
  const [limit, setLimit] = useState(card ? String(card.creditLimit || "") : "");
  const [used, setUsed] = useState(card ? String(card.usedAmount || "") : "");
  const [closing, setClosing] = useState(dayValue(card?.closingDay));
  const [due, setDue] = useState(dayValue(card?.dueDay));

  function next() { setDir(1); setStep((s) => s + 1); }
  function back() { setDir(-1); setStep((s) => s - 1); }

  function handleSubmit() {
    const issuerInfo = ISSUERS[issuerKey] ?? ISSUERS.otro;
    const closingDay = parseDay(closing);
    const dueDay = parseDay(due);
    const payload = {
      label: label.trim() || `${issuerInfo.name} ${network.charAt(0).toUpperCase() + network.slice(1)}`,
      network,
      issuerKey,
      creditLimit: parseMoney(limit),
      usedAmount: parseMoney(used),
      lastFourDigits: lastFour.trim() || undefined,
      color: issuerInfo.color,
      closingDay: closingDay ?? (card?.closingDay ? null : undefined),
      dueDay: dueDay ?? (card?.dueDay ? null : undefined),
    };
    if (card) updateCreditCard(card.id, payload);
    else addCreditCard(payload);
    onSuccess?.();
  }

  const issuerInfo = ISSUERS[issuerKey] ?? ISSUERS.otro;

  const steps = [
    /* 0 — Red de pago */
    <div key="step0" className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">¿Qué red de pago tiene tu tarjeta?</p>
      <div className="grid grid-cols-3 gap-3">
        {NETWORKS.map(({ key, label: lbl }) => (
          <button
            key={key}
            type="button"
            onClick={() => setNetwork(key)}
            className={cn(
              "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all",
              network === key ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/30"
            )}
          >
            {/* Network logos: SVGs directos sin fondo */}
            <span className="flex h-8 items-center">
              <NetworkMark network={key} tone="on-light" />
            </span>
            <span className="text-xs text-muted-foreground">{lbl}</span>
          </button>
        ))}
      </div>
      <Button className="w-full" onClick={next}>Continuar →</Button>
    </div>,

    /* 1 — Emisor */
    <div key="step1" className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">¿Qué banco o fintech la emite?</p>
      <div className="space-y-3">
        <div>
          <p className="mb-2 text-[13px] text-[#9aa1ab]">Bancos</p>
          <div className="grid grid-cols-3 gap-1.5">
            {BANK_ISSUERS.map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => setIssuerKey(key)}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs transition-all text-left",
                  issuerKey === key ? "border-foreground bg-foreground/5 font-medium" : "border-border hover:border-foreground/30 text-muted-foreground"
                )}
              >
                {info.domain ? (
                  <img
                    src={logoUrl(info.domain, 32)}
                    alt={info.name}
                    className="w-5 h-5 object-contain shrink-0 logo-light"
                  />
                ) : (
                  <div className="w-4 h-4 rounded shrink-0 flex items-center justify-center text-[7px] font-medium"
                    style={{ background: info.color, color: info.textColor }}>{info.abbr.slice(0,1)}</div>
                )}
                <span className="truncate leading-tight">{info.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[13px] text-[#9aa1ab]">Fintechs</p>
          <div className="grid grid-cols-3 gap-1.5">
            {FINTECH_ISSUERS.map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => setIssuerKey(key)}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs transition-all text-left",
                  issuerKey === key ? "border-foreground bg-foreground/5 font-medium" : "border-border hover:border-foreground/30 text-muted-foreground"
                )}
              >
                {info.domain ? (
                  <img
                    src={logoUrl(info.domain, 32)}
                    alt={info.name}
                    className="w-5 h-5 object-contain shrink-0 logo-light"
                  />
                ) : (
                  <div className="w-4 h-4 rounded shrink-0 flex items-center justify-center text-[7px] font-medium"
                    style={{ background: info.color, color: info.textColor }}>{info.abbr.slice(0,1)}</div>
                )}
                <span className="truncate leading-tight">{info.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={back} className="gap-1">
          <ChevronLeft size={14} /> Atrás
        </Button>
        <Button className="flex-1" onClick={next}>Continuar →</Button>
      </div>
    </div>,

    /* 2 — Límite y detalles */
    <div key="step2" className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
        <IssuerAvatar issuerKey={issuerKey} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{issuerInfo.name}</p>
          <p className="text-xs text-muted-foreground">{network.charAt(0).toUpperCase() + network.slice(1)}</p>
        </div>
        <NetworkMark network={network} tone="on-light" />
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="label" className="text-xs">Nombre personalizado (opcional)</Label>
          <Input
            id="label"
            placeholder={`${issuerInfo.name} ${network.charAt(0).toUpperCase() + network.slice(1)}`}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastFour" className="text-xs">Últimos 4 dígitos (opcional)</Label>
          <Input
            id="lastFour"
            placeholder="1234"
            maxLength={4}
            value={lastFour}
            onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="closing" className="text-xs">Día de cierre</Label>
            <Input
              id="closing"
              inputMode="numeric"
              placeholder="25"
              maxLength={2}
              value={closing}
              onChange={(e) => setClosing(e.target.value.replace(/\D/g, "").slice(0, 2))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="due" className="text-xs">Día de vencimiento</Label>
            <Input
              id="due"
              inputMode="numeric"
              placeholder="10"
              maxLength={2}
              value={due}
              onChange={(e) => setDue(e.target.value.replace(/\D/g, "").slice(0, 2))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="limit" className="text-xs">Límite de crédito</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="limit"
                placeholder="500.000"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="used" className="text-xs">Saldo utilizado</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="used"
                placeholder="0"
                value={used}
                onChange={(e) => setUsed(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={back} className="gap-1">
          <ChevronLeft size={14} /> Atrás
        </Button>
        <Button className="flex-1" onClick={handleSubmit}>
          {card ? "Guardar cambios" : "Guardar tarjeta"}
        </Button>
      </div>
    </div>,
  ];

  return (
    <div>
      <StepDots total={3} current={step} />
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {steps[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
