"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShapeStore } from "@/lib/store";
import { ISSUERS, type CardNetwork } from "@/lib/types";
import { logoUrl, NETWORK_DOMAINS } from "@/lib/logodev";
import { IssuerAvatar } from "@/components/credit-card-visual";
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
}

export function CardForm({ onSuccess }: CardFormProps) {
  const addCreditCard = useShapeStore((s) => s.addCreditCard);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const [network, setNetwork] = useState<CardNetwork>("visa");
  const [issuerKey, setIssuerKey] = useState("otro");
  const [label, setLabel] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [limit, setLimit] = useState("");
  const [used, setUsed] = useState("");

  function next() { setDir(1); setStep((s) => s + 1); }
  function back() { setDir(-1); setStep((s) => s - 1); }

  function handleSubmit() {
    const issuerInfo = ISSUERS[issuerKey] ?? ISSUERS.otro;
    addCreditCard({
      label: label.trim() || `${issuerInfo.name} ${network.charAt(0).toUpperCase() + network.slice(1)}`,
      network,
      issuerKey,
      creditLimit: parseFloat(limit.replace(/\./g, "").replace(",", ".")) || 0,
      usedAmount: parseFloat(used.replace(/\./g, "").replace(",", ".")) || 0,
      lastFourDigits: lastFour.trim() || undefined,
      color: issuerInfo.color,
    });
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
            {key === "visa" && (
              <div className="h-8 flex items-center">
                <span className="text-[22px] font-medium italic tracking-tight" style={{ color: "#1A1F71", fontFamily: "Arial, sans-serif" }}>VISA</span>
              </div>
            )}
            {key === "mastercard" && (
              <div className="h-8 flex items-center">
                <span className="flex">
                  <span className="w-7 h-7 rounded-full bg-[#EB001B] block" />
                  <span className="w-7 h-7 rounded-full bg-[#F79E1B] block -ml-3.5 opacity-95" />
                </span>
              </div>
            )}
            {key === "amex" && (
              <div className="h-8 flex items-center">
                <span className="text-base font-medium tracking-wide" style={{ color: "#2E77BC" }}>AMEX</span>
              </div>
            )}
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
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-2">Bancos</p>
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
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-2">Fintechs</p>
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
        <img
          src={logoUrl(NETWORK_DOMAINS[network], 40)}
          alt={network}
          className="h-6 w-auto object-contain logo-light"
        />
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
          Guardar tarjeta
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
