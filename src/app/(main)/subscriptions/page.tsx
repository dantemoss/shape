"use client";

import { useState, useMemo } from "react";
import { useShapeStore } from "@/lib/store";
import {
  SUB_PERIOD_LABELS, SUB_CATEGORY_LABELS,
  type Subscription, type SubPeriod,
} from "@/lib/types";
import { logoUrl } from "@/lib/logodev";
import { SubscriptionForm } from "@/components/subscription-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus, Trash2, RefreshCw, DollarSign,
  Pause, Play, TrendingUp,
} from "lucide-react";
import { format, addMonths, addWeeks, addYears, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

/* ── Helpers ──────────────────────────────────────── */
function getNextRenewal(sub: Subscription): Date {
  const start = new Date(sub.startDate);
  const now   = new Date();
  now.setHours(0, 0, 0, 0);

  let next = new Date(start);
  const advance = sub.period === "monthly"
    ? (d: Date) => addMonths(d, 1)
    : sub.period === "yearly"
    ? (d: Date) => addYears(d, 1)
    : (d: Date) => addWeeks(d, 1);

  while (next <= now) next = advance(next);
  return next;
}

function monthlyEquivalent(sub: Subscription): number {
  if (sub.period === "monthly") return sub.price;
  if (sub.period === "weekly")  return sub.price * 4.33;
  return sub.price / 12; // yearly
}

function daysLabel(days: number): string {
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days <= 7)  return `${days}d`;
  if (days <= 30) return `${days}d`;
  return `${Math.round(days / 30)}m`;
}

function urgencyColor(days: number): string {
  if (days <= 3)  return "text-expense";
  if (days <= 7)  return "text-yellow-600";
  return "text-muted-foreground";
}

/* ─────────────────────────────────────────────────── */
export default function SubscriptionsPage() {
  const subscriptions    = useShapeStore((s) => s.subscriptions);
  const removeSubscription = useShapeStore((s) => s.removeSubscription);
  const updateSubscription = useShapeStore((s) => s.updateSubscription);

  const [open, setOpen]   = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  /* Ordenadas por próxima renovación (más próxima primero) */
  const sorted = useMemo(() =>
    [...subscriptions].sort((a, b) => {
      if (!a.active && b.active) return 1;
      if (a.active && !b.active) return -1;
      return getNextRenewal(a).getTime() - getNextRenewal(b).getTime();
    }),
    [subscriptions]
  );

  const active   = sorted.filter((s) => s.active);
  const inactive = sorted.filter((s) => !s.active);

  /* Totales mensuales en ARS (USD sin convertir — se muestra por separado) */
  const monthlyARS = active
    .filter((s) => s.currency === "ARS")
    .reduce((sum, s) => sum + monthlyEquivalent(s), 0);
  const monthlyUSD = active
    .filter((s) => s.currency === "USD")
    .reduce((sum, s) => sum + monthlyEquivalent(s), 0);

  function handleRemove(id: string) {
    if (confirmId === id) {
      removeSubscription(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 2500);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <div className="border-b border-border sticky top-0 bg-background z-10">
        <div className="flex items-center justify-between px-4 sm:px-8 pt-4 pb-2">
          <h1 className="text-lg font-medium">Suscripciones</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
              <Plus size={14} />
              <span className="hidden sm:inline">Nueva</span>
              <span className="sm:hidden">Agregar</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Agregar suscripción</DialogTitle>
              </DialogHeader>
              <SubscriptionForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Totales mensuales */}
        {active.length > 0 && (
          <div className="flex items-center gap-4 px-4 sm:px-8 pb-3">
            {monthlyARS > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-expense" />
                <span className="text-sm font-mono text-expense">
                  ${Math.round(monthlyARS).toLocaleString("es-AR")} ARS/mes
                </span>
              </div>
            )}
            {monthlyUSD > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                <span className="text-sm font-mono text-muted-foreground">
                  ${monthlyUSD.toFixed(2)} USD/mes
                </span>
              </div>
            )}
            <div className="h-3 w-px bg-border" />
            <span className="text-xs text-muted-foreground font-mono">
              {active.length} activa{active.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 px-4 sm:px-8 py-5 space-y-8">

        {subscriptions.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center border border-dashed border-border rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <RefreshCw size={24} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium mb-1">Sin suscripciones</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Agregá tus suscripciones para ver cuánto gastás por mes y cuándo se renuevan.
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button className="gap-2 mt-2" />}>
                <Plus size={14} />
                Agregar primera suscripción
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Agregar suscripción</DialogTitle></DialogHeader>
                <SubscriptionForm onSuccess={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <>
            {/* ── Activas ── */}
            {active.length > 0 && (
              <section>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-3 px-1">
                  Activas · {active.length}
                </p>
                <div className="rounded-2xl border border-border overflow-hidden bg-card divide-y divide-border">
                  {active.map((sub) => (
                    <SubscriptionRow
                      key={sub.id}
                      sub={sub}
                      confirmId={confirmId}
                      onRemove={handleRemove}
                      onToggle={() => updateSubscription(sub.id, { active: !sub.active })}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Pausadas ── */}
            {inactive.length > 0 && (
              <section>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-3 px-1">
                  Pausadas · {inactive.length}
                </p>
                <div className="rounded-2xl border border-border overflow-hidden bg-card divide-y divide-border opacity-60">
                  {inactive.map((sub) => (
                    <SubscriptionRow
                      key={sub.id}
                      sub={sub}
                      confirmId={confirmId}
                      onRemove={handleRemove}
                      onToggle={() => updateSubscription(sub.id, { active: !sub.active })}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Resumen por período ── */}
            {active.length > 1 && (
              <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <SummaryCard
                  label="Este mes"
                  amountARS={monthlyARS}
                  amountUSD={monthlyUSD}
                  icon={<RefreshCw size={14} />}
                />
                <SummaryCard
                  label="Al año"
                  amountARS={monthlyARS * 12}
                  amountUSD={monthlyUSD * 12}
                  icon={<TrendingUp size={14} />}
                />
                <SummaryCard
                  label="Próxima renovación"
                  nextRenewal={active.length > 0 ? getNextRenewal(active[0]) : undefined}
                  nextName={active[0]?.name}
                  icon={<DollarSign size={14} />}
                  className="col-span-2 sm:col-span-1"
                />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Sub-componentes ─────────────────────────────── */

function SubscriptionRow({
  sub, confirmId, onRemove, onToggle,
}: {
  sub: Subscription;
  confirmId: string | null;
  onRemove: (id: string) => void;
  onToggle: () => void;
}) {
  const nextRenewal = getNextRenewal(sub);
  const daysLeft    = differenceInDays(nextRenewal, new Date());
  const isConfirming = confirmId === sub.id;

  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5 group transition-colors hover:bg-muted/20">
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
        {sub.domain ? (
          <img
            src={logoUrl(sub.domain, 64)}
            alt={sub.name}
            className="w-7 h-7 object-contain"
          />
        ) : (
          <span className="text-sm font-medium text-muted-foreground">
            {sub.name[0]}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug truncate">{sub.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {SUB_CATEGORY_LABELS[sub.category]}
          </span>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <span className="text-xs text-muted-foreground">
            {SUB_PERIOD_LABELS[sub.period as SubPeriod]}
          </span>
        </div>
      </div>

      {/* Precio */}
      <div className="text-right shrink-0">
        <p className="text-sm font-mono font-medium">
          {sub.currency === "USD" ? "U$D " : "$"}
          {sub.price.toLocaleString("es-AR")}
        </p>
        <p className={cn("text-[11px] font-mono", urgencyColor(daysLeft))}>
          {sub.active
            ? `Renueva en ${daysLabel(daysLeft)}`
            : format(nextRenewal, "d MMM", { locale: es })}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggle}
          className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-all"
          title={sub.active ? "Pausar" : "Activar"}
        >
          {sub.active ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <button
          onClick={() => onRemove(sub.id)}
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center transition-all",
            isConfirming
              ? "bg-expense text-white scale-110"
              : "text-muted-foreground/60 hover:text-expense hover:bg-expense/10"
          )}
          title={isConfirming ? "Tocá de nuevo para confirmar" : "Eliminar"}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

function SummaryCard({
  label, amountARS, amountUSD, nextRenewal, nextName, icon, className,
}: {
  label:        string;
  amountARS?:   number;
  amountUSD?:   number;
  nextRenewal?: Date;
  nextName?:    string;
  icon:         React.ReactNode;
  className?:   string;
}) {
  return (
    <div className={cn("border border-border rounded-2xl p-4 bg-card", className)}>
      <div className="flex items-center gap-1.5 mb-2 text-muted-foreground">
        {icon}
        <p className="text-[10px] font-mono uppercase tracking-wider">{label}</p>
      </div>
      {nextRenewal ? (
        <>
          <p className="text-sm font-medium">{nextName}</p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {format(nextRenewal, "d 'de' MMMM", { locale: es })}
          </p>
        </>
      ) : (
        <>
          {(amountARS ?? 0) > 0 && (
            <p className="text-lg font-medium font-mono text-expense">
              ${Math.round(amountARS!).toLocaleString("es-AR")}
            </p>
          )}
          {(amountUSD ?? 0) > 0 && (
            <p className={cn("font-mono text-sm", (amountARS ?? 0) > 0 ? "text-muted-foreground" : "text-lg font-medium text-foreground")}>
              U$D {amountUSD!.toFixed(2)}
            </p>
          )}
        </>
      )}
    </div>
  );
}
