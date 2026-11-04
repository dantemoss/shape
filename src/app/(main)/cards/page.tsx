"use client";

import { useState } from "react";
import { useShapeStore } from "@/lib/store";
import { MetalCardFace } from "@/components/credit-card-visual";
import { CardForm } from "@/components/card-form";
import { InstallmentForm } from "@/components/installment-form";
import {
  Amount,
  Card,
  CardMenu,
  EmptyState,
  IconWell,
  InfoTip,
  ListRow,
  PageHeader,
  pageStackClass,
} from "@/components/primitives";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cardGlance, cuotaLine } from "@/lib/card-cycle";
import { formatIso } from "@/lib/format-date";
import { ISSUERS, type CardInstallment, type CreditCard } from "@/lib/types";
import { todayISO } from "@/lib/dates";
import { CheckCircle2, CreditCard as CardIcon, Plus, Trash2 } from "lucide-react";

export default function CardsPage() {
  const creditCards = useShapeStore((s) => s.creditCards);
  const cardInstallments = useShapeStore((s) => s.cardInstallments);
  const removeCreditCard = useShapeStore((s) => s.removeCreditCard);
  const payInstallment = useShapeStore((s) => s.payInstallment);
  const removeCardInstallment = useShapeStore((s) => s.removeCardInstallment);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<CreditCard | null>(null);
  const [installmentCardId, setInstallmentCardId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const today = todayISO();

  const activeInstallments = cardInstallments.filter(
    (installment) => installment.paidInstallments < installment.totalInstallments
  );
  const finishedInstallments = cardInstallments.filter(
    (installment) => installment.paidInstallments >= installment.totalInstallments
  );

  return (
    <div className="min-w-0">
      <PageHeader
        title="Tarjetas"
        subtitle={
          creditCards.length > 0
            ? `${creditCards.length} ${creditCards.length === 1 ? "tarjeta" : "tarjetas"}`
            : "Resumen, cierre y cuotas"
        }
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger render={<Button className="gap-2 rounded-full" />}>
              <Plus size={14} />
              Nueva tarjeta
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Agregar tarjeta</DialogTitle>
              </DialogHeader>
              <CardForm onSuccess={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      <div className={pageStackClass}>
        {creditCards.length === 0 ? (
          <EmptyState
            icon={
              <IconWell size="lg">
                <CardIcon size={18} />
              </IconWell>
            }
            title="Sin tarjetas todavía"
            action={
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger render={<Button className="gap-2 rounded-full" />}>
                  <Plus size={14} />
                  Agregar primera tarjeta
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar tarjeta</DialogTitle>
                  </DialogHeader>
                  <CardForm onSuccess={() => setAddOpen(false)} />
                </DialogContent>
              </Dialog>
            }
          >
            Cargá el cierre, el vencimiento y el límite para ver el próximo resumen.
          </EmptyState>
        ) : (
          <div className="space-y-4 xl:max-w-[824px]">
            <div className="flex flex-col items-stretch gap-4 xl:flex-row xl:flex-wrap">
              {creditCards.map((card) => (
                <WalletCard
                  key={card.id}
                  card={card}
                  today={today}
                  installments={cardInstallments}
                  onEdit={() => setEditing(card)}
                  onAddInstallment={() => setInstallmentCardId(card.id)}
                  onRemove={() => setRemoveId(card.id)}
                />
              ))}
            </div>

            {activeInstallments.length > 0 || finishedInstallments.length > 0 ? (
              <Card title="Cuotas" subtitle="Lo que falta pagar en cada plan">
                <div className="space-y-2">
                  {activeInstallments.map((installment) => {
                    const card = creditCards.find((item) => item.id === installment.cardId);
                    const remaining = installment.totalInstallments - installment.paidInstallments;
                    const monthly = installment.totalAmount / installment.totalInstallments;
                    return (
                      <ListRow
                        key={installment.id}
                        className="rounded-2xl bg-[#f6f7f9] px-3 py-2.5"
                        title={installment.description}
                        meta={`${card?.label ?? "Tarjeta"} · ${installment.paidInstallments}/${installment.totalInstallments} · quedan ${remaining}`}
                        amount={<Amount value={monthly} size="secondary" />}
                        trailing={
                          <>
                            <button
                              type="button"
                              aria-label="Marcar cuota como pagada"
                              onClick={() => payInstallment(installment.id)}
                              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F48A1]/40"
                            >
                              <IconWell size="sm">
                                <CheckCircle2 size={13} />
                              </IconWell>
                            </button>
                            <button
                              type="button"
                              aria-label="Eliminar cuota"
                              onClick={() => removeCardInstallment(installment.id)}
                              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F48A1]/40"
                            >
                              <IconWell size="sm">
                                <Trash2 size={12} />
                              </IconWell>
                            </button>
                          </>
                        }
                      />
                    );
                  })}
                  {finishedInstallments.map((installment) => (
                    <ListRow
                      key={installment.id}
                      className="px-3 py-2"
                      icon={
                        <IconWell size="sm">
                          <CheckCircle2 size={13} />
                        </IconWell>
                      }
                      title={installment.description}
                      meta="Completa"
                      amount={<Amount value={installment.totalAmount} size="secondary" />}
                      trailing={
                        <button
                          type="button"
                          aria-label="Eliminar cuota"
                          onClick={() => removeCardInstallment(installment.id)}
                        >
                          <IconWell size="sm">
                            <Trash2 size={12} />
                          </IconWell>
                        </button>
                      }
                    />
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        )}
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar tarjeta</DialogTitle>
          </DialogHeader>
          {editing ? <CardForm key={editing.id} card={editing} onSuccess={() => setEditing(null)} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={installmentCardId !== null} onOpenChange={(open) => !open && setInstallmentCardId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva cuota</DialogTitle>
          </DialogHeader>
          {installmentCardId ? (
            <InstallmentForm cardId={installmentCardId} onSuccess={() => setInstallmentCardId(null)} />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={removeId !== null} onOpenChange={(open) => !open && setRemoveId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar tarjeta</DialogTitle>
          </DialogHeader>
          <p className="text-[14px] leading-snug text-[#3a4150]">Se borra la tarjeta y las cuotas que tiene cargadas.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setRemoveId(null)}>
              Cancelar
            </Button>
            <Button
              className="rounded-full bg-expense text-white hover:bg-expense/90"
              onClick={() => {
                if (removeId) removeCreditCard(removeId);
                setRemoveId(null);
              }}
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WalletCard({
  card,
  today,
  installments,
  onEdit,
  onAddInstallment,
  onRemove,
}: {
  card: CreditCard;
  today: string;
  installments: CardInstallment[];
  onEdit: () => void;
  onAddInstallment: () => void;
  onRemove: () => void;
}) {
  const glance = cardGlance(card, installments, today);
  const issuer = ISSUERS[card.issuerKey] ?? ISSUERS.otro;
  const heading = glance.dueLabel ?? glance.closeLabel ?? "Saldo";
  const showClose = Boolean(glance.dueLabel && glance.closeLabel);
  const tip =
    glance.phase === "payment"
      ? "Es el saldo del resumen que ya cerró. La línea de abajo es el cierre que todavía se arma."
      : glance.statementFromInstallments
        ? "Cuotas que entran en el cierre que viene, y vencen en la fecha de arriba."
        : "No hay cuotas en este cierre. El número es el saldo usado.";

  return (
    <Card className="h-full w-full max-w-[404px] xl:w-[404px] xl:shrink-0">
      <div className="flex h-full min-w-0 flex-col">
        <MetalCardFace card={card} />
        <div className="mt-4 flex items-start justify-between gap-3">
          <p className="min-w-0 truncate text-[17px] font-semibold tracking-[-0.03em] text-[#1c1f26]">
            {card.label.trim() || issuer.name}
          </p>
          <CardMenu
            label={`Opciones de ${card.label || issuer.name}`}
            items={[
              { label: "Editar", onSelect: onEdit },
              { label: "Agregar cuota", onSelect: onAddInstallment },
              { label: "Eliminar", onSelect: onRemove },
            ]}
          />
        </div>
        <div className="mt-3 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] leading-none text-[#9aa1ab]">{heading}</p>
            <InfoTip text={tip} />
          </div>
          <div className="mt-1.5">
            <Amount value={glance.statement} size="hero" tone={glance.overLimit ? "expense" : "neutral"} animate />
          </div>
        </div>
        {showClose ? (
          <p className="mt-3 text-[13px] leading-snug text-[#6d7480]">
            {glance.closeLabel}
            {glance.closeISO ? ` · ${formatIso(glance.closeISO, "d MMM")}` : ""}
          </p>
        ) : null}
        <p className="mt-3 text-[13px] leading-snug text-[#6d7480]">{cuotaLine(glance.thisMonth, glance.later)}</p>
        {glance.available !== null && glance.usedPct !== null ? (
          <div className="mt-auto pt-4">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-[#9aa1ab]">Disponible</span>
              <Amount value={glance.available} size="secondary" tone={glance.overLimit ? "expense" : "neutral"} />
            </div>
            <div
              className="h-1 overflow-hidden rounded-full bg-[#e6e8ee]"
              role="meter"
              aria-label="Uso del límite"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(glance.usedPct)}
            >
              <div
                className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-200 motion-safe:ease-out"
                style={{ width: `${glance.usedPct}%`, background: glance.overLimit ? "#e5484d" : "#1f9d55" }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
