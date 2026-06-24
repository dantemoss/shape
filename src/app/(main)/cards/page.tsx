"use client";

import { useState } from "react";
import { useShapeStore } from "@/lib/store";
import { CreditCardVisual, IssuerAvatar } from "@/components/credit-card-visual";
import { CardForm } from "@/components/card-form";
import { InstallmentForm } from "@/components/installment-form";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Trash2, CreditCard as CardIcon } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ISSUERS } from "@/lib/types";
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-background z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-medium">Tarjetas</h1>
          {creditCards.length > 0 && (
            <span className="text-sm text-muted-foreground font-mono">
              {creditCards.length} {creditCards.length === 1 ? "tarjeta" : "tarjetas"}
            </span>
          )}
        </div>
        <Dialog open={addCardOpen} onOpenChange={setAddCardOpen}>
          <DialogTrigger render={<Button className="gap-2" />}>
            <Plus size={14} />
            Nueva tarjeta
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Agregar tarjeta</DialogTitle></DialogHeader>
            <CardForm onSuccess={() => { setAddCardOpen(false); }} />
          </DialogContent>
        </Dialog>
      </div>

      {creditCards.length === 0 ? (
        /* ── Empty state ── */
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <CardIcon size={28} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium mb-1">Sin tarjetas todavía</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Agregá tus tarjetas de crédito para ver el límite disponible y seguir las cuotas pendientes.
            </p>
          </div>
          <Dialog open={addCardOpen} onOpenChange={setAddCardOpen}>
            <DialogTrigger render={<Button className="gap-2" />}>
              <Plus size={14} />
              Agregar primera tarjeta
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Agregar tarjeta</DialogTitle></DialogHeader>
              <CardForm onSuccess={() => setAddCardOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* ── Sidebar de tarjetas ── */}
          <div className="md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-border p-4 space-y-3 overflow-y-auto">
            {/* Resumen global */}
            <div className="border border-border rounded-xl p-3.5 bg-card space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Resumen global</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground font-mono">Límite total</p>
                  <p className="text-sm font-medium font-mono">${totalLimit.toLocaleString("es-AR")}</p>
                </div>
                <div>
                  <p className="text-[10px] text-income font-mono">Disponible</p>
                  <p className="text-sm font-medium font-mono text-income">${totalAvailable.toLocaleString("es-AR")}</p>
                </div>
              </div>
              {totalMonthly > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground font-mono">Cuotas este mes</p>
                  <p className="text-sm font-medium font-mono text-expense">
                    ~${Math.round(totalMonthly).toLocaleString("es-AR")}
                  </p>
                </div>
              )}
            </div>

            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono px-1">Mis tarjetas</p>
            {creditCards.map((card) => {
              const issuer = ISSUERS[card.issuerKey] ?? ISSUERS.otro;
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
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {card.network.toUpperCase()}
                      {card.lastFourDigits ? ` •${card.lastFourDigits}` : ""}
                      {instCount > 0 && ` · ${instCount} cuota${instCount > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-income">${available.toLocaleString("es-AR")}</p>
                  </div>
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
                                      className="w-7 h-7 rounded-full bg-income/10 text-income hover:bg-income/20 flex items-center justify-center transition-colors"
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
                                      className="w-7 h-7 rounded-full bg-expense/10 text-expense hover:bg-expense/20 flex items-center justify-center transition-colors"
                                    />
                                  }>
                                    <Trash2 size={13} />
                                  </TooltipTrigger>
                                  <TooltipContent>Eliminar cuota</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                              <span>{inst.paidInstallments}/{inst.totalInstallments} pagadas · quedan {remaining}</span>
                              <span className="text-expense">${Math.round(monthly).toLocaleString("es-AR")}/mes</span>
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
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-2">
                      Completadas
                    </p>
                    <div className="space-y-1.5">
                      {selectedInstallments
                        .filter((i) => i.paidInstallments >= i.totalInstallments)
                        .map((inst) => (
                          <div key={inst.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 text-muted-foreground">
                            <CheckCircle2 size={13} className="text-income shrink-0" />
                            <span className="text-xs flex-1 truncate">{inst.description}</span>
                            <span className="text-xs font-mono">${inst.totalAmount.toLocaleString("es-AR")}</span>
                            <button
                              onClick={() => removeCardInstallment(inst.id)}
                              className="hover:text-expense transition-colors"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
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
