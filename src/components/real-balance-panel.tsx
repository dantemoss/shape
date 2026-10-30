"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { Ellipsis, Info, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { allowance } from "@/lib/chart-series";
import { formatIso } from "@/lib/format-date";
import { adjustmentForTarget, buildMoneySnapshot, formatPesos } from "@/lib/money";
import { useShapeStore } from "@/lib/store";
import { useMoneySnapshot } from "@/lib/use-money";
import { todayISO } from "@/lib/dates";
import { cn } from "@/lib/utils";

function parseAmount(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function usdChip(income: number, expense: number): string | null {
  if (income <= 0 && expense <= 0) return null;
  if (income > 0 && expense > 0) return "USD aparte";
  const amount = (income > 0 ? income : expense).toLocaleString("es-AR", { maximumFractionDigits: 2 });
  return `US$${amount} aparte`;
}

export function RealBalancePanel() {
  const snapshot = useMoneySnapshot();
  const account = useShapeStore((s) => s.account);
  const adjustments = useShapeStore((s) => s.adjustments);
  const ledgerReady = useShapeStore((s) => s.ledgerReady);
  const transactions = useShapeStore((s) => s.transactions);
  const salaryConfig = useShapeStore((s) => s.salaryConfig);
  const salaryPayments = useShapeStore((s) => s.salaryPayments);
  const saveAccount = useShapeStore((s) => s.saveAccount);
  const reconcileAccount = useShapeStore((s) => s.reconcileAccount);

  const [baselineOpen, setBaselineOpen] = useState(false);
  const [reconcileOpen, setReconcileOpen] = useState(false);

  const period = snapshot.payPeriod;
  const balance = snapshot.account.balance;
  const budget = period ? allowance(period.salaryExpected, period.expense, period.daysLeft) : null;
  const usd = usdChip(snapshot.usd.income, snapshot.usd.expense);
  const salaryChip = period
    ? period.salaryReceived > 0
      ? "Sueldo cobrado"
      : "Sueldo pendiente"
    : null;
  const payWhen = !period
    ? null
    : period.isToday
      ? "hoy"
      : period.daysLeft === 1
        ? "en 1 día"
        : `en ${period.daysLeft} días`;
  const remainLine = budget && budget.expected > 0 && payWhen
    ? `${budget.left >= 0 ? "Te quedan" : "Te pasaste"} ${formatPesos(Math.abs(budget.left))} del sueldo · ${period?.isToday ? "cobrás hoy" : period?.daysLeft === 1 ? "cobrás mañana" : `cobrás ${payWhen}`}`
    : null;

  const info = [
    snapshot.account.hasBaseline
      ? `Base del ${formatIso(account?.startingDate ?? snapshot.today, "d 'de' MMMM")} más ingresos menos gastos en pesos desde ese día. El sueldo esperado no entra hasta que lo marcás como cobrado.`
      : "Cargá cuánta plata tenías en Mercado Pago un día puntual. Desde ahí se suman los ingresos y se restan los gastos.",
    `Cuenta: ${account?.name ?? "Mercado Pago"}.`,
    ...adjustments.slice(0, 3).map((adjustment) =>
      `Ajuste ${formatPesos(adjustment.amount)} el ${formatIso(adjustment.date, "d MMM")}${adjustment.note ? ` · ${adjustment.note}` : ""}.`
    ),
  ].join(" ");

  return (
    <div className="viz-card">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-[#f4f5f7] text-[#1c1f26]">
          <Wallet size={13} />
        </div>
        <span className="text-[15px] font-medium text-[#1c1f26]">Saldo real</span>
        <InfoNote text={info} />
        <div className="ml-auto">
          <CardMenu
            ledgerReady={ledgerReady}
            hasBaseline={snapshot.account.hasBaseline}
            onReconcile={() => setReconcileOpen(true)}
            onBaseline={() => setBaselineOpen(true)}
          />
        </div>
      </div>

      {snapshot.account.hasBaseline ? (
        <p className={cn("num text-[clamp(2rem,7vw,2.6rem)]", balance < 0 && "text-expense")}>
          $<NumberFlow value={balance} locales="es-AR" format={{ maximumFractionDigits: 2 }} />
        </p>
      ) : (
        <p className="text-[1.6rem] font-semibold tracking-tight text-[#9aa1ab]">Todavía no hay saldo</p>
      )}

      {remainLine ? <p className="mt-2 max-w-xl text-[14px] leading-snug text-[#6d7480]">{remainLine}</p> : null}

      {(salaryChip || usd) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {salaryChip ? (
            <span className="rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[12px] font-medium text-[#1c1f26]">{salaryChip}</span>
          ) : null}
          {usd ? (
            <span className="rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[12px] font-medium text-[#1c1f26]">{usd}</span>
          ) : null}
        </div>
      )}

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-black/[0.06] pt-4">
        <Stat label="Entró este mes" value={formatPesos(snapshot.calendarMonth.income)} tone="text-income" />
        <Stat label="Salió este mes" value={formatPesos(snapshot.calendarMonth.expense)} tone="text-expense" />
        <Stat
          label="Próximo cobro"
          value={period ? formatIso(period.end, "d 'de' MMM") : "Sin fecha"}
          hint={payWhen ?? undefined}
        />
      </div>

      {!ledgerReady ? (
        <p className="mt-4 text-[13px] leading-snug text-[#8b919c]">
          Falta correr la migración de saldos en Supabase para guardar la base y los ajustes.
        </p>
      ) : null}

      <BaselineDialog
        open={baselineOpen}
        onOpenChange={setBaselineOpen}
        initial={
          account
            ? { name: account.name, amount: String(account.startingBalance), date: account.startingDate }
            : { name: "Mercado Pago", amount: "", date: todayISO() }
        }
        transactions={transactions}
        adjustments={adjustments}
        salaryConfig={salaryConfig}
        salaryPayments={salaryPayments}
        onSave={(input) => {
          saveAccount(input);
          setBaselineOpen(false);
        }}
      />

      <ReconcileDialog
        open={reconcileOpen}
        onOpenChange={setReconcileOpen}
        calculated={balance}
        onConfirm={(target, note) => {
          reconcileAccount(target, note);
          setReconcileOpen(false);
        }}
      />
    </div>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] text-[#9aa1ab]">{label}</p>
      <p className={cn("mt-1 truncate text-[clamp(0.82rem,3.2vw,1rem)] font-semibold tracking-tight tabular-nums", tone ?? "text-[#1c1f26]")}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[13px] text-[#6d7480]">{hint}</p> : null}
    </div>
  );
}

function InfoNote({ text }: { text: string }) {
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
        aria-label="Cómo se calcula el saldo"
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

function CardMenu({
  ledgerReady,
  hasBaseline,
  onReconcile,
  onBaseline,
}: {
  ledgerReady: boolean;
  hasBaseline: boolean;
  onReconcile: () => void;
  onBaseline: () => void;
}) {
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
        aria-label="Más opciones del saldo"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex size-9 items-center justify-center rounded-full bg-[#f5f6f8] text-[#a0a6b0] ring-1 ring-black/[0.04]"
      >
        <Ellipsis size={16} />
      </button>
      {open ? (
        <div className="absolute top-11 right-0 z-30 w-56 rounded-2xl bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.06]">
          <Link
            href="/transactions"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2.5 text-[14px] text-[#1c1f26] hover:bg-[#f6f7f9]"
          >
            Ver movimientos
          </Link>
          <button
            type="button"
            disabled={!ledgerReady || !hasBaseline}
            onClick={() => {
              setOpen(false);
              onReconcile();
            }}
            className="block w-full rounded-xl px-3 py-2.5 text-left text-[14px] text-[#1c1f26] hover:bg-[#f6f7f9] disabled:opacity-40"
          >
            Ajustar a mi saldo real
          </button>
          <button
            type="button"
            disabled={!ledgerReady}
            onClick={() => {
              setOpen(false);
              onBaseline();
            }}
            className="block w-full rounded-xl px-3 py-2.5 text-left text-[14px] text-[#1c1f26] hover:bg-[#f6f7f9] disabled:opacity-40"
          >
            {hasBaseline ? "Corregir saldo inicial" : "Cargar saldo inicial"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function BaselineDialog({
  open,
  onOpenChange,
  initial,
  transactions,
  adjustments,
  salaryConfig,
  salaryPayments,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: { name: string; amount: string; date: string };
  transactions: ReturnType<typeof useShapeStore.getState>["transactions"];
  adjustments: ReturnType<typeof useShapeStore.getState>["adjustments"];
  salaryConfig: ReturnType<typeof useShapeStore.getState>["salaryConfig"];
  salaryPayments: ReturnType<typeof useShapeStore.getState>["salaryPayments"];
  onSave: (input: { name: string; startingBalance: number; startingDate: string }) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [amount, setAmount] = useState(initial.amount);
  const [date, setDate] = useState(initial.date);

  const parsed = parseAmount(amount);
  const preview = useMemo(() => {
    if (parsed == null || !date) return null;
    return buildMoneySnapshot({
      account: { startingBalance: parsed, startingDate: date },
      transactions,
      adjustments,
      salaryConfig,
      salaryPayments,
    });
  }, [adjustments, date, parsed, salaryConfig, salaryPayments, transactions]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setName(initial.name);
          setAmount(initial.amount);
          setDate(initial.date);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Saldo inicial</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (parsed == null || !date) return;
            onSave({ name, startingBalance: parsed, startingDate: date });
          }}
        >
          <p className="text-sm text-muted-foreground">
            Es la plata que tenías al empezar ese día. Los movimientos de esa fecha y los de después se suman o se restan. No borra el historial.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="account-name">Cuenta</Label>
            <Input id="account-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account-amount">Monto en pesos</Label>
            <Input
              id="account-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account-date">Fecha de esa base</Label>
            <Input id="account-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </div>
          {preview?.account.hasBaseline && (
            <p className="text-sm font-mono">
              Con esta base, hoy tendrías {formatPesos(preview.account.balance)}.
            </p>
          )}
          <Button type="submit" className="w-full" disabled={parsed == null || !date}>
            Guardar saldo inicial
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReconcileDialog({
  open,
  onOpenChange,
  calculated,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculated: number;
  onConfirm: (target: number, note: string) => void;
}) {
  const [raw, setRaw] = useState("");
  const [note, setNote] = useState("");
  const target = parseAmount(raw);
  const delta = target == null ? null : adjustmentForTarget(calculated, target);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setRaw("");
          setNote("");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar a mi saldo real</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (target == null || delta == null) return;
            onConfirm(target, note);
          }}
        >
          <p className="text-sm text-muted-foreground">
            El saldo calculado es {formatPesos(calculated)}. Escribí el saldo que ves en Mercado Pago. Guardamos la diferencia como un ajuste, sin tocar los movimientos.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="real-balance">Saldo real de hoy</Label>
            <Input
              id="real-balance"
              inputMode="decimal"
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adjust-note">Nota (opcional)</Label>
            <Input
              id="adjust-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ej: diferencia con Mercado Pago"
            />
          </div>
          {target != null && delta == null && (
            <p className="text-sm text-muted-foreground">Ya coincide. No hace falta anotar nada.</p>
          )}
          {delta != null && (
            <p className="text-sm">
              Vamos a anotar un ajuste de <span className="font-mono font-medium">{formatPesos(delta)}</span> con fecha de hoy.
            </p>
          )}
          <Button type="submit" className="w-full" disabled={target == null || delta == null}>
            Confirmar ajuste
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
