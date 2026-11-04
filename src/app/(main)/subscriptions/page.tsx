"use client";

import { useMemo, useState } from "react";
import { useShapeStore } from "@/lib/store";
import { SubscriptionForm } from "@/components/subscription-form";
import { ServiceMark } from "@/components/service-mark";
import {
  Amount,
  Card,
  Chip,
  EmptyState,
  IconWell,
  InfoTip,
  ListRow,
  PageHeader,
  pageStackClass,
} from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addDaysISO, addMonthsISO, daysBetween, todayISO } from "@/lib/dates";
import { categoryForName, detectRecurringCharges } from "@/lib/recurring-charges";
import { domainForName } from "@/lib/service-marks";
import { SUB_PERIOD_LABELS, type SubPeriod, type Subscription } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react";

function nextRenewal(sub: Subscription, today: string): string {
  let next = sub.startDate;
  let guard = 0;
  if (sub.period === "weekly") {
    while (next < today && guard < 520) {
      next = addDaysISO(next, 7);
      guard += 1;
    }
    return next;
  }
  const step = sub.period === "yearly" ? 12 : 1;
  while (next < today && guard < 240) {
    next = addMonthsISO(next, step);
    guard += 1;
  }
  return next;
}

function monthlyEquivalent(sub: Subscription): number {
  if (sub.period === "monthly") return sub.price;
  if (sub.period === "weekly") return sub.price * (52 / 12);
  return sub.price / 12;
}

function whenLabel(days: number): string {
  if (days <= 0) return "hoy";
  if (days === 1) return "mañana";
  return `en ${days} días`;
}

export default function SubscriptionsPage() {
  const subscriptions = useShapeStore((s) => s.subscriptions);
  const transactions = useShapeStore((s) => s.transactions);
  const removeSubscription = useShapeStore((s) => s.removeSubscription);
  const updateSubscription = useShapeStore((s) => s.updateSubscription);
  const addSubscription = useShapeStore((s) => s.addSubscription);

  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const today = todayISO();

  const sorted = useMemo(
    () =>
      [...subscriptions].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return nextRenewal(a, today).localeCompare(nextRenewal(b, today));
      }),
    [subscriptions, today]
  );

  const active = sorted.filter((subscription) => subscription.active);
  const inactive = sorted.filter((subscription) => !subscription.active);
  const monthlyARS = active
    .filter((subscription) => subscription.currency === "ARS")
    .reduce((sum, subscription) => sum + monthlyEquivalent(subscription), 0);
  const monthlyUSD = active
    .filter((subscription) => subscription.currency === "USD")
    .reduce((sum, subscription) => sum + monthlyEquivalent(subscription), 0);

  const { suggestions, increases } = useMemo(
    () => detectRecurringCharges(transactions, subscriptions),
    [transactions, subscriptions]
  );
  const increaseById = useMemo(() => new Map(increases.map((item) => [item.subscriptionId, item])), [increases]);

  function handleRemove(id: string) {
    if (confirmId === id) {
      removeSubscription(id);
      setConfirmId(null);
      return;
    }
    setConfirmId(id);
    window.setTimeout(() => setConfirmId((current) => (current === id ? null : current)), 2500);
  }

  const addButton = (
    <Button className="gap-2 rounded-full" onClick={() => setOpen(true)}>
      <Plus size={14} />
      Nueva suscripción
    </Button>
  );

  return (
    <div className="min-w-0">
      <PageHeader
        title="Suscripciones"
        subtitle={active.length > 0 ? `${active.length} ${active.length === 1 ? "activa" : "activas"}` : "Lo que se renueva solo"}
        action={addButton}
      />

      <div className={cn(pageStackClass, "space-y-4")}>
        {subscriptions.length === 0 && suggestions.length === 0 ? (
          <EmptyState
            icon={
              <IconWell size="lg">
                <RefreshCw size={18} />
              </IconWell>
            }
            title="Sin suscripciones"
            action={
              <Button className="gap-2 rounded-full" onClick={() => setOpen(true)}>
                <Plus size={14} />
                Nueva suscripción
              </Button>
            }
          >
            Agregá lo que se cobra solo. Si un gasto se repite, te lo vamos a marcar.
          </EmptyState>
        ) : (
          <>
            {active.length > 0 ? (
              <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
                <Card
                  className="h-full"
                  title="Este mes"
                  action={
                    <InfoTip text="Los pesos y los dólares no se suman. Al año es doce veces el mes." />
                  }
                >
                  <div className="flex h-full min-w-0 flex-col">
                    {monthlyARS > 0 ? (
                      <Amount value={monthlyARS} size="hero" tone="expense" animate />
                    ) : (
                      <Amount value={monthlyUSD} size="hero" currency="USD" tone="expense" animate />
                    )}
                    {monthlyARS > 0 && monthlyUSD > 0 ? (
                      <div className="mt-3">
                        <Amount value={monthlyUSD} size="primary" currency="USD" tone="expense" />
                      </div>
                    ) : null}
                    <p className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-4 text-[14px] text-[#3a4150]">
                      <span className="text-[#9aa1ab]">Al año</span>
                      {monthlyARS > 0 ? <Amount value={monthlyARS * 12} size="secondary" tone="expense" /> : null}
                      {monthlyARS > 0 && monthlyUSD > 0 ? <span className="text-[#b0b6bf]">·</span> : null}
                      {monthlyUSD > 0 ? (
                        <Amount value={monthlyUSD * 12} size="secondary" currency="USD" tone="expense" />
                      ) : null}
                    </p>
                  </div>
                </Card>

                <Card className="h-full" title="Próximos cobros">
                  <ul className="flex min-w-0 flex-1 flex-col gap-1">
                    {active.map((subscription) => {
                      const renewal = nextRenewal(subscription, today);
                      const days = daysBetween(today, renewal);
                      const increase = increaseById.get(subscription.id);
                      return (
                        <li key={subscription.id}>
                          <SubscriptionRow
                            subscription={subscription}
                            when={whenLabel(days)}
                            increased={Boolean(increase)}
                            confirming={confirmId === subscription.id}
                            onToggle={() => updateSubscription(subscription.id, { active: !subscription.active })}
                            onRemove={() => handleRemove(subscription.id)}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </div>
            ) : null}

            {suggestions.length > 0 ? (
              <Card
                title="Para sumar"
                subtitle="Mismo comercio, un monto parecido, una vez por mes"
                action={<InfoTip text="Sale de tus gastos. Sumar la copia como suscripción y no vuelve a aparecer." />}
              >
                <ul className="flex flex-col gap-1">
                  {suggestions.map((suggestion) => (
                    <li key={`${suggestion.currency}:${suggestion.key}`}>
                      <ListRow
                        className="py-2"
                        icon={<ServiceMark name={suggestion.label} />}
                        title={suggestion.label}
                        meta={
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <span className="truncate">{suggestion.chargeCount} cobros</span>
                            {suggestion.increased ? <Chip className="shrink-0">Subió</Chip> : null}
                          </span>
                        }
                        amount={
                          <Amount
                            value={suggestion.latestAmount}
                            size="secondary"
                            currency={suggestion.currency}
                            tone="expense"
                          />
                        }
                        trailing={
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 rounded-full px-3"
                            onClick={() =>
                              addSubscription({
                                name: suggestion.label,
                                domain: domainForName(suggestion.label),
                                price: suggestion.latestAmount,
                                currency: suggestion.currency,
                                period: "monthly",
                                startDate: suggestion.latestDate,
                                active: true,
                                category: categoryForName(suggestion.label),
                              })
                            }
                          >
                            Sumar
                          </Button>
                        }
                      />
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {inactive.length > 0 ? (
              <Card title="Pausadas">
                <ul className="flex flex-col gap-1">
                  {inactive.map((subscription) => (
                    <li key={subscription.id}>
                      <SubscriptionRow
                        subscription={subscription}
                        when="pausada"
                        increased={false}
                        confirming={confirmId === subscription.id}
                        onToggle={() => updateSubscription(subscription.id, { active: !subscription.active })}
                        onRemove={() => handleRemove(subscription.id)}
                      />
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar suscripción</DialogTitle>
          </DialogHeader>
          <SubscriptionForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubscriptionRow({
  subscription,
  when,
  increased,
  confirming,
  onToggle,
  onRemove,
}: {
  subscription: Subscription;
  when: string;
  increased: boolean;
  confirming: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <ListRow
      className="py-2"
      icon={<ServiceMark name={subscription.name} domain={subscription.domain} />}
      title={subscription.name}
      meta={
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span className="truncate">
            {when}
            {subscription.period !== "monthly" ? ` · ${SUB_PERIOD_LABELS[subscription.period as SubPeriod]}` : ""}
          </span>
          {increased ? (
            <Chip className="shrink-0">
              <span aria-label="El último cobro fue más alto que el anterior">Subió</span>
            </Chip>
          ) : null}
        </span>
      }
      amount={
        <Amount value={subscription.price} size="secondary" currency={subscription.currency} tone="expense" />
      }
      trailing={
        <>
          <button
            type="button"
            onClick={onToggle}
            aria-label={subscription.active ? "Pausar" : "Activar"}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F48A1]/40"
          >
            <IconWell size="sm">{subscription.active ? <Pause size={12} /> : <Play size={12} />}</IconWell>
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={confirming ? "Confirmar eliminación" : "Eliminar"}
            className={cn(
              "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F48A1]/40",
              confirming && "flex h-8 items-center bg-expense px-2.5 text-[12px] font-medium text-white"
            )}
          >
            {confirming ? "Eliminar" : (
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
