"use client";

import { useState, useMemo } from "react";
import { useShapeStore } from "@/lib/store";
import {
  SUB_PERIOD_LABELS, SUB_CATEGORY_LABELS,
  type Subscription, type SubPeriod,
} from "@/lib/types";
import { logoUrl } from "@/lib/logodev";
import { SubscriptionForm } from "@/components/subscription-form";
import { Amount, Card, CategoryDot, EmptyState, IconWell, ListRow, PageHeader, Stat, pageStackClass } from "@/components/primitives";
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
import { parseDateOnly, todayISO } from "@/lib/dates";

/* ── Helpers ──────────────────────────────────────── */
function getNextRenewal(sub: Subscription, today = todayISO()): Date {
  const start = parseDateOnly(sub.startDate);
  const now = parseDateOnly(today);

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
    <div className="min-w-0">
      <PageHeader
        title="Suscripciones"
        subtitle={
          active.length > 0 ? (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {monthlyARS > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <CategoryDot color="#e5484d" />
                  <Amount value={Math.round(monthlyARS)} size="secondary" tone="expense" /> /mes
                </span>
              ) : null}
              {monthlyUSD > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <CategoryDot color="#6d7480" />
                  <Amount value={monthlyUSD} size="secondary" currency="USD" /> /mes
                </span>
              ) : null}
              <span>
                {active.length} activa{active.length === 1 ? "" : "s"}
              </span>
            </span>
          ) : (
            "Lo que se renueva solo"
          )
        }
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button className="gap-2 rounded-full" />}>
              <Plus size={14} />
              Nueva suscripción
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Agregar suscripción</DialogTitle>
              </DialogHeader>
              <SubscriptionForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      {/* ── Contenido ── */}
      <div className={cn(pageStackClass, "space-y-6")}>
        {subscriptions.length === 0 ? (
          <EmptyState
            icon={
              <IconWell size="lg">
                <RefreshCw size={18} />
              </IconWell>
            }
            title="Sin suscripciones"
            action={
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger render={<Button className="gap-2 rounded-full" />}>
                  <Plus size={14} />
                  Nueva suscripción
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar suscripción</DialogTitle>
                  </DialogHeader>
                  <SubscriptionForm onSuccess={() => setOpen(false)} />
                </DialogContent>
              </Dialog>
            }
          >
            Agregá tus suscripciones para ver cuánto gastás por mes y cuándo se renuevan.
          </EmptyState>
        ) : (
          <>
            {/* ── Activas ── */}
            {active.length > 0 && (
              <section>
                <p className="mb-3 px-1 text-[13px] text-[#9aa1ab]">Activas · {active.length}</p>
                <div className="viz-card divide-y divide-black/[0.04] !py-1">
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
                <p className="mb-3 px-1 text-[13px] text-[#9aa1ab]">Pausadas · {inactive.length}</p>
                <div className="viz-card divide-y divide-black/[0.04] !py-1 opacity-70">
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
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

  const renewal = sub.active ? `Renueva en ${daysLabel(daysLeft)}` : format(nextRenewal, "d MMM", { locale: es });

  return (
    <ListRow
      className="py-3"
      icon={
        sub.domain ? (
          <img src={logoUrl(sub.domain, 64)} alt="" className="size-9 shrink-0 rounded-full object-contain" />
        ) : (
          <IconWell>
            <span className="text-[13px] font-semibold">{sub.name[0]}</span>
          </IconWell>
        )
      }
      title={sub.name}
      meta={`${SUB_CATEGORY_LABELS[sub.category]} · ${SUB_PERIOD_LABELS[sub.period as SubPeriod]} · ${renewal}`}
      amount={<Amount value={sub.price} size="secondary" currency={sub.currency} tone="expense" />}
      trailing={
        <>
          <button type="button" onClick={onToggle} title={sub.active ? "Pausar" : "Activar"} aria-label={sub.active ? "Pausar" : "Activar"}>
            <IconWell size="sm">{sub.active ? <Pause size={12} /> : <Play size={12} />}</IconWell>
          </button>
          <button
            type="button"
            onClick={() => onRemove(sub.id)}
            title={isConfirming ? "Tocá de nuevo para confirmar" : "Eliminar"}
            aria-label={isConfirming ? "Confirmar eliminación" : "Eliminar"}
            className={isConfirming ? "flex size-7 items-center justify-center rounded-full bg-expense text-white" : undefined}
          >
            {isConfirming ? <Trash2 size={12} /> : (
              <IconWell size="sm">
                <Trash2 size={12} />
              </IconWell>
            )}
          </button>
        </>
      }
    />
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
    <Card className={className} title={label} action={<IconWell size="sm">{icon}</IconWell>}>
      {nextRenewal ? (
        <Stat label={nextName ?? "Próxima"} value={format(nextRenewal, "d 'de' MMMM", { locale: es })} size="md" />
      ) : (
        <div className="space-y-1">
          {(amountARS ?? 0) > 0 ? <Amount value={Math.round(amountARS!)} tone="expense" /> : null}
          {(amountUSD ?? 0) > 0 ? <div className="mt-1"><Amount value={amountUSD!} currency="USD" /></div> : null}
        </div>
      )}
    </Card>
  );
}
