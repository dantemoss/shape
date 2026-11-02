"use client";

import { useState } from "react";
import { useShapeStore } from "@/lib/store";
import { CreditCardVisual, IssuerAvatar } from "@/components/credit-card-visual";
import { CardForm } from "@/components/card-form";
import { InstallmentForm } from "@/components/installment-form";
import { Amount, Card, EmptyState, IconWell, ListRow, PageHeader, Stat, StatRow, pageStackClass } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Trash2, CreditCard as CardIcon } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export default function CardsPage() {
  const creditCards = useShapeStore((s) => s.creditCards);
  const cardInstallments = useShapeStore((s) => s.cardInstallments);
  const removeCreditCard = useShapeStore((s) => s.removeCreditCard);
  const payInstallment = useShapeStore((s) => s.payInstallment);
  const removeCardInstallment = useShapeStore((s) => s.removeCardInstallment);

  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    creditCards[0]?.id ?? null
  );
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [addInstOpen, setAddInstOpen] = useState(false);

  const selectedCard = creditCards.find((c) => c.id === selectedCardId) ?? creditCards[0] ?? null;
  const selectedInstallments = selectedCard
    ? cardInstallments.filter((i) => i.cardId === selectedCard.id)
    : [];
  const activeInstallments = selectedInstallments.filter((i) => i.paidInstallments < i.totalInstallments);

  const totalUsed = creditCards.reduce((s, c) => s + c.usedAmount, 0);
  const totalLimit = creditCards.reduce((s, c) => s + c.creditLimit, 0);
  const totalAvailable = totalLimit - totalUsed;
  const totalMonthly = cardInstallments
    .filter((i) => i.paidInstallments < i.totalInstallments)
    .reduce((s, i) => s + i.totalAmount / i.totalInstallments, 0);

  return (
    <div className="min-w-0">
      <PageHeader
        title="Tarjetas"
        subtitle={
          creditCards.length > 0
            ? `${creditCards.length} ${creditCards.length === 1 ? "tarjeta" : "tarjetas"}`
            : "Límite y cuotas"
        }
        action={
          <Dialog open={addCardOpen} onOpenChange={setAddCardOpen}>
            <DialogTrigger render={<Button className="gap-2 rounded-full" />}>
              <Plus size={14} />
              Nueva tarjeta
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Agregar tarjeta</DialogTitle>
              </DialogHeader>
              <CardForm onSuccess={() => setAddCardOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      {creditCards.length === 0 ? (
        /* ── Empty state ── */
        <div className={pageStackClass}>
          <EmptyState
            icon={
              <IconWell size="lg">
                <CardIcon size={18} />
              </IconWell>
            }
            title="Sin tarjetas todavía"
            action={
              <Dialog open={addCardOpen} onOpenChange={setAddCardOpen}>
                <DialogTrigger render={<Button className="gap-2 rounded-full" />}>
                  <Plus size={14} />
                  Agregar primera tarjeta
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar tarjeta</DialogTitle>
                  </DialogHeader>
                  <CardForm onSuccess={() => setAddCardOpen(false)} />
                </DialogContent>
              </Dialog>
            }
          >
            Agregá tus tarjetas de crédito para ver el límite disponible y seguir las cuotas pendientes.
          </EmptyState>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* ── Sidebar de tarjetas ── */}
          <div className="md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-border p-4 space-y-3 overflow-y-auto">
            {/* Resumen global */}
            <Card title="Resumen">
              <StatRow columns={2}>
                <Stat label="Límite total" value={<Amount value={totalLimit} animate />} />
                <Stat label="Disponible" value={<Amount value={totalAvailable} tone={totalAvailable < 0 ? "expense" : "income"} animate />} />
              </StatRow>
              {totalMonthly > 0 ? (
                <div className="mt-3 border-t border-black/[0.06] pt-3">
                  <Stat label="Cuotas este mes" value={<Amount value={Math.round(totalMonthly)} tone="expense" />} />
                </div>
              ) : null}
            </Card>

            <p className="px-1 text-[13px] text-[#9aa1ab]">Mis tarjetas</p>
            {creditCards.map((card) => {
              const available = card.creditLimit - card.usedAmount;
              const active = selectedCard?.id === card.id;
              const instCount = cardInstallments.filter((i) => i.cardId === card.id && i.paidInstallments < i.totalInstallments).length;

              return (
                <button
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    active ? "border-foreground/20 bg-foreground/5" : "border-border hover:bg-muted/30"
                  )}
                >
                  <IssuerAvatar issuerKey={card.issuerKey} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{card.label}</p>
                    <p className="truncate text-[12px] text-[#9aa1ab]">
                      {card.network}
                      {card.lastFourDigits ? ` · ${card.lastFourDigits}` : ""}
                      {instCount > 0 ? ` · ${instCount} cuota${instCount > 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                  <Amount value={available} size="secondary" tone={available < 0 ? "expense" : "income"} />
                </button>
              );
            })}
          </div>

          {/* ── Detalle de tarjeta ── */}
          {selectedCard && (
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
              <div className="max-w-md mx-auto space-y-6">
                {/* Card visual */}
                <CreditCardVisual
                  card={selectedCard}
                  installments={selectedInstallments}
                  onRemove={(id) => {
                    removeCreditCard(id);
                    setSelectedCardId(creditCards.find((c) => c.id !== id)?.id ?? null);
                  }}
                />

                {/* Cuotas pendientes con acciones */}
                {activeInstallments.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium">Gestionar cuotas</p>
                      <Dialog open={addInstOpen} onOpenChange={setAddInstOpen}>
                        <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" />}>
                          <Plus size={11} />
                          Agregar
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm">
                          <DialogHeader><DialogTitle>Nueva cuota</DialogTitle></DialogHeader>
                          <InstallmentForm cardId={selectedCard.id} onSuccess={() => setAddInstOpen(false)} />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-2">
                      {activeInstallments.map((inst) => {
                        const remaining = inst.totalInstallments - inst.paidInstallments;
                        const monthly = inst.totalAmount / inst.totalInstallments;
                        const pct = (inst.paidInstallments / inst.totalInstallments) * 100;
                        return (
                          <div key={inst.id} className="border border-border rounded-xl p-3.5 space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium flex-1 leading-tight">{inst.description}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <Tooltip>
                                  <TooltipTrigger render={
                                    <button
                                      onClick={() => payInstallment(inst.id)}
                                      className="flex size-7 items-center justify-center rounded-full border border-black/[0.06] bg-[#f4f5f7] text-[#1c1f26] transition-colors hover:bg-white"
                                    />
                                  }>
                                    <CheckCircle2 size={13} />
                                  </TooltipTrigger>
                                  <TooltipContent>Marcar cuota como pagada</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger render={
                                    <button
                                      onClick={() => removeCardInstallment(inst.id)}
                                      className="flex size-7 items-center justify-center rounded-full border border-black/[0.06] bg-[#f4f5f7] text-[#1c1f26] transition-colors hover:bg-white"
                                    />
                                  }>
                                    <Trash2 size={13} />
                                  </TooltipTrigger>
                                  <TooltipContent>Eliminar cuota</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-[12px] text-[#9aa1ab]">
                              <span className="min-w-0 truncate">{inst.paidInstallments}/{inst.totalInstallments} pagadas · quedan {remaining}</span>
                              <Amount value={Math.round(monthly)} size="secondary" tone="expense" />
                            </div>
                            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-income transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Si no hay cuotas activas, mostrar botón para agregar */}
                {activeInstallments.length === 0 && (
                  <Dialog open={addInstOpen} onOpenChange={setAddInstOpen}>
                    <DialogTrigger render={
                      <Button variant="outline" className="w-full gap-2 border-dashed" />
                    }>
                      <Plus size={14} />
                      Agregar cuota en cuotas
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm">
                      <DialogHeader><DialogTitle>Nueva cuota</DialogTitle></DialogHeader>
                      <InstallmentForm cardId={selectedCard.id} onSuccess={() => setAddInstOpen(false)} />
                    </DialogContent>
                  </Dialog>
                )}

                {/* Cuotas terminadas */}
                {selectedInstallments.filter((i) => i.paidInstallments >= i.totalInstallments).length > 0 && (
                  <div>
                    <p className="mb-2 text-[13px] text-[#9aa1ab]">Completadas</p>
                    <div className="space-y-1.5">
                      {selectedInstallments
                        .filter((i) => i.paidInstallments >= i.totalInstallments)
                        .map((inst) => (
                          <ListRow
                            key={inst.id}
                            className="rounded-2xl bg-[#f6f7f9] px-3 py-2"
                            icon={
                              <IconWell size="sm">
                                <CheckCircle2 size={13} />
                              </IconWell>
                            }
                            title={inst.description}
                            amount={<Amount value={inst.totalAmount} size="secondary" />}
                            trailing={
                              <button
                                type="button"
                                onClick={() => removeCardInstallment(inst.id)}
                                aria-label="Eliminar cuota"
                              >
                                <IconWell size="sm">
                                  <Trash2 size={12} />
                                </IconWell>
                              </button>
                            }
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
