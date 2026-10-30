"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoneyAgreement } from "@/components/money-agreement";
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

function SpendingRing({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(Math.max(pct, 0) / 100, 1) * circ;
  const color = pct >= 90 ? "oklch(0.577 0.245 27.325)" : pct >= 70 ? "oklch(0.70 0.18 55)" : "oklch(0.55 0.15 162)";
  return (
    <svg width={72} height={72} viewBox="0 0 72 72" className="-rotate-90">
      <circle cx={36} cy={36} r={r} fill="none" stroke="oklch(0.92 0 0)" strokeWidth={6} />
      <circle
        cx={36}
        cy={36}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
      />
    </svg>
  );
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
  const spendPct = period ? Math.round(period.spendPct) : 0;
  const balance = snapshot.account.balance;

  return (
    <div className="viz-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-[#f4f5f7] text-[#1c1f26]">
              <Wallet size={13} />
            </div>
            <span className="font-medium text-sm">Saldo real</span>
            <span className="text-[10px] text-muted-foreground font-mono truncate">
              {account?.name ?? "Mercado Pago"}
            </span>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground ml-1">
                Ver todo →
              </Button>
            </Link>
          </div>

          {snapshot.account.hasBaseline ? (
            <p className={cn("num mb-1 text-[clamp(2rem,8vw,2.6rem)]", balance < 0 && "text-expense")}>
              $<NumberFlow value={balance} locales="es-AR" format={{ maximumFractionDigits: 2 }} />
            </p>
          ) : (
            <p className="text-2xl font-medium text-muted-foreground mb-1">Todavía no hay saldo</p>
          )}
          <p className="text-xs text-muted-foreground mb-4 max-w-md">
            {snapshot.account.hasBaseline
              ? `Base del ${formatIso(account?.startingDate ?? snapshot.today, "d 'de' MMMM")} más ingresos menos gastos en pesos desde ese día. El sueldo esperado no entra hasta que lo marcás como cobrado.`
              : "Cargá cuánta plata tenías en Mercado Pago un día puntual. Desde ahí se suman los ingresos y se restan los gastos."}
          </p>

          <MoneyAgreement showSaldo={false} className="mb-4" />

          {period && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-1">
                  Sueldo de este período
                </p>
                {period.salaryReceived > 0 ? (
                  <p className="text-sm font-mono text-income">Cobrado {formatPesos(period.salaryReceived)}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Todavía no cobraste</p>
                )}
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  Esperado {formatPesos(period.salaryExpected)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-1">
                  Gastado este período
                </p>
                <p className="text-sm font-mono text-expense">{formatPesos(period.expense)}</p>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  {formatIso(period.start, "d MMM")} → {formatIso(period.end, "d MMM")}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-1">
                  Próximo cobro
                </p>
                <p className="text-sm font-medium">{formatIso(period.end, "d 'de' MMM")}</p>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  {period.isToday ? "Es hoy" : `${period.daysLeft} días`}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {!ledgerReady ? (
              <p className="text-xs text-muted-foreground">
                Falta correr la migración de saldos en Supabase para guardar la base y los ajustes.
              </p>
            ) : snapshot.account.hasBaseline ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => setReconcileOpen(true)}>
                  Ajustar a mi saldo real
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setBaselineOpen(true)}>
                  Corregir saldo inicial
                </Button>
              </>
            ) : (
              <Button type="button" size="sm" onClick={() => setBaselineOpen(true)}>
                Cargar saldo inicial
              </Button>
            )}
          </div>

          {adjustments.length > 0 && (
            <ul className="mt-4 space-y-1">
              {adjustments.slice(0, 3).map((adjustment) => (
                <li key={adjustment.id} className="text-[11px] text-muted-foreground font-mono">
                  Ajuste {formatPesos(adjustment.amount)} el {formatIso(adjustment.date, "d MMM")}
                  {adjustment.note ? ` · ${adjustment.note}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>

        {period && period.salaryExpected > 0 && (
          <div className="hidden shrink-0 flex-col items-center gap-1 sm:flex">
            <div className="relative">
              <SpendingRing pct={spendPct} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    spendPct >= 90 ? "text-expense" : spendPct >= 70 ? "text-yellow-600" : "text-income"
                  )}
                >
                  {spendPct}%
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono text-center leading-tight">
              del sueldo
              <br />
              esperado
            </p>
          </div>
        )}
      </div>

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
