"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDownLeft,
  BookOpen,
  Car,
  Clapperboard,
  HeartPulse,
  House,
  PiggyBank,
  Plus,
  RefreshCw,
  Search,
  Shirt,
  SlidersHorizontal,
  Trash2,
  Utensils,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { TransactionForm } from "@/components/transaction-form";
import { MoneyAgreement } from "@/components/money-agreement";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { iconWell } from "@/components/viz/ui";
import { useShapeStore } from "@/lib/store";
import { CATEGORY_LABELS, type ExpenseCategory, type Transaction } from "@/lib/types";
import { useMoneySnapshot } from "@/lib/use-money";
import { cn } from "@/lib/utils";
import {
  clampRange,
  groupByDay,
  matchesFilters,
  monthRange,
  movementAmount,
  movementClock,
  movementDetail,
  movementTitle,
  periodRange,
  shortRangeLabel,
  signedFormat,
  summarize,
  weekdayPattern,
  type CategoryFilter,
  type CurrencyFilter,
  type DateRange,
  type RangePreset,
  type TypeFilter,
} from "./logic";
import { WeekdayBars } from "./weekday-bars";

const CATEGORY_DOT: Record<ExpenseCategory, string> = {
  housing: "#7c6cf0",
  food: "#d08a1f",
  transport: "#d97706",
  entertainment: "#db2777",
  health: "#1f9d55",
  education: "#3b82f6",
  subscriptions: "#ea580c",
  clothing: "#db2777",
  savings: "#1f9d55",
  other: "#6d7480",
};

const CATEGORY_ICON: Record<ExpenseCategory, LucideIcon> = {
  housing: House,
  food: Utensils,
  transport: Car,
  entertainment: Clapperboard,
  health: HeartPulse,
  education: BookOpen,
  subscriptions: RefreshCw,
  clothing: Shirt,
  savings: PiggyBank,
  other: Wallet,
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ExpenseCategory[];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
];

const CURRENCY_OPTIONS: { value: CurrencyFilter; label: string }[] = [
  { value: "all", label: "Ambas" },
  { value: "ARS", label: "Pesos" },
  { value: "USD", label: "Dólares" },
];

const RANGE_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: "period", label: "Este período" },
  { value: "month", label: "Este mes" },
  { value: "custom", label: "Elegir fechas" },
];

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "h-8 rounded-full px-3 text-[13px] font-medium duration-200 ease-out motion-reduce:transition-none",
        selected
          ? "bg-[#1c1f26] text-white hover:bg-[#1c1f26] hover:text-white"
          : "bg-[#f5f6f8] text-[#3a4150] hover:bg-[#eceef1]"
      )}
    >
      {children}
    </Button>
  );
}

function FilterFields({
  type,
  category,
  currency,
  preset,
  customFrom,
  customTo,
  onType,
  onCategory,
  onCurrency,
  onPreset,
  onCustomFrom,
  onCustomTo,
  dense = false,
}: {
  type: TypeFilter;
  category: CategoryFilter;
  currency: CurrencyFilter;
  preset: RangePreset;
  customFrom: string;
  customTo: string;
  onType: (value: TypeFilter) => void;
  onCategory: (value: CategoryFilter) => void;
  onCurrency: (value: CurrencyFilter) => void;
  onPreset: (value: RangePreset) => void;
  onCustomFrom: (value: string) => void;
  onCustomTo: (value: string) => void;
  dense?: boolean;
}) {
  const dates = preset === "custom" ? (
    <div className="grid min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2">
      <label className="min-w-0">
        <span className="mb-1 block text-[13px] text-[#9aa1ab]">Desde</span>
        <Input
          type="date"
          value={customFrom}
          max={customTo || undefined}
          onChange={(event) => onCustomFrom(event.target.value)}
          className="h-9 rounded-2xl border-0 bg-[#f5f6f8] px-3 text-[14px] shadow-none"
        />
      </label>
      <label className="min-w-0">
        <span className="mb-1 block text-[13px] text-[#9aa1ab]">Hasta</span>
        <Input
          type="date"
          value={customTo}
          min={customFrom || undefined}
          onChange={(event) => onCustomTo(event.target.value)}
          className="h-9 rounded-2xl border-0 bg-[#f5f6f8] px-3 text-[14px] shadow-none"
        />
      </label>
    </div>
  ) : null;

  if (dense) {
    return (
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {TYPE_OPTIONS.map((option) => (
            <Chip key={option.value} selected={type === option.value} onClick={() => onType(option.value)}>
              {option.label}
            </Chip>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-black/[0.08] sm:block" aria-hidden />
          {CURRENCY_OPTIONS.map((option) => (
            <Chip key={option.value} selected={currency === option.value} onClick={() => onCurrency(option.value)}>
              {option.label}
            </Chip>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-black/[0.08] sm:block" aria-hidden />
          {RANGE_OPTIONS.map((option) => (
            <Chip key={option.value} selected={preset === option.value} onClick={() => onPreset(option.value)}>
              {option.label}
            </Chip>
          ))}
        </div>
        <div className="flex min-w-0 flex-wrap gap-1.5">
          <Chip selected={category === "all"} onClick={() => onCategory("all")}>
            Todas
          </Chip>
          {CATEGORIES.map((value) => (
            <Chip key={value} selected={category === value} onClick={() => onCategory(value)}>
              {CATEGORY_LABELS[value]}
            </Chip>
          ))}
        </div>
        {dates}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <fieldset className="min-w-0">
        <legend className="mb-2 text-[13px] text-[#9aa1ab]">Tipo</legend>
        <div className="flex flex-wrap gap-1.5">
          {TYPE_OPTIONS.map((option) => (
            <Chip key={option.value} selected={type === option.value} onClick={() => onType(option.value)}>
              {option.label}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset className="min-w-0">
        <legend className="mb-2 text-[13px] text-[#9aa1ab]">Categoría</legend>
        <div className="flex flex-wrap gap-1.5">
          <Chip selected={category === "all"} onClick={() => onCategory("all")}>
            Todas
          </Chip>
          {CATEGORIES.map((value) => (
            <Chip key={value} selected={category === value} onClick={() => onCategory(value)}>
              {CATEGORY_LABELS[value]}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset className="min-w-0">
        <legend className="mb-2 text-[13px] text-[#9aa1ab]">Moneda</legend>
        <div className="flex flex-wrap gap-1.5">
          {CURRENCY_OPTIONS.map((option) => (
            <Chip key={option.value} selected={currency === option.value} onClick={() => onCurrency(option.value)}>
              {option.label}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset className="min-w-0">
        <legend className="mb-2 text-[13px] text-[#9aa1ab]">Fechas</legend>
        <div className="flex flex-wrap gap-1.5">
          {RANGE_OPTIONS.map((option) => (
            <Chip key={option.value} selected={preset === option.value} onClick={() => onPreset(option.value)}>
              {option.label}
            </Chip>
          ))}
        </div>
        {dates ? <div className="mt-3">{dates}</div> : null}
      </fieldset>
    </div>
  );
}

function MovementRow({
  transaction,
  confirming,
  onArm,
  onRemove,
}: {
  transaction: Transaction;
  confirming: boolean;
  onArm: () => void;
  onRemove: () => void;
}) {
  const Icon = transaction.type === "income" ? ArrowDownLeft : CATEGORY_ICON[transaction.category];
  const clock = movementClock(transaction);
  const amount = movementAmount(transaction);

  return (
    <li className="flex min-w-0 items-center gap-3 px-3.5 py-3 duration-200 ease-out motion-reduce:transition-none hover:bg-[#f7f8fa] sm:px-4">
      <span className={iconWell}>
        <Icon size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-[#1c1f26]">{movementTitle(transaction)}</span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] leading-snug text-[#6d7480]">
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: CATEGORY_DOT[transaction.category] }}
          />
          <span className="line-clamp-2 min-w-0">{movementDetail(transaction)}</span>
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span
          className={cn(
            "block text-[14px] font-semibold tabular-nums",
            transaction.type === "income" ? "text-[#1f9d55]" : "text-[#1c1f26]"
          )}
        >
          {amount}
        </span>
        {clock ? <span className="mt-0.5 block text-[12px] text-[#9aa1ab] tabular-nums">{clock}</span> : null}
      </span>
      {confirming ? (
        <Button
          type="button"
          size="sm"
          onClick={onRemove}
          className="h-7 shrink-0 rounded-full bg-expense px-2.5 text-[12px] text-white duration-200 ease-out hover:bg-expense motion-reduce:transition-none"
        >
          Borrar
        </Button>
      ) : (
        <button
          type="button"
          onClick={onArm}
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-[#f4f5f7] text-[#1c1f26] duration-200 ease-out hover:bg-white motion-reduce:transition-none"
          title="Eliminar"
          aria-label={`Eliminar ${movementTitle(transaction)}`}
        >
          <Trash2 size={13} />
        </button>
      )}
    </li>
  );
}

export function MovementScreen() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [currency, setCurrency] = useState<CurrencyFilter>("all");
  const [preset, setPreset] = useState<RangePreset>("period");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLElement>(null);

  const transactions = useShapeStore((s) => s.transactions);
  const removeTransaction = useShapeStore((s) => s.removeTransaction);
  const snapshot = useMoneySnapshot();

  useEffect(() => {
    const head = headRef.current;
    const page = pageRef.current;
    if (!head || !page) return;
    const apply = () => {
      page.style.setProperty("--mov-head", `${Math.ceil(head.getBoundingClientRect().height)}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(head);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const range = useMemo<DateRange>(() => {
    if (preset === "month") return monthRange(snapshot.today);
    if (preset === "custom") return clampRange(customFrom, customTo, snapshot.today);
    return periodRange(
      snapshot.payPeriod ? { start: snapshot.payPeriod.start, end: snapshot.payPeriod.end } : null,
      snapshot.today
    );
  }, [customFrom, customTo, preset, snapshot.payPeriod, snapshot.today]);

  const filtered = useMemo(
    () => transactions.filter((transaction) => matchesFilters(transaction, { query, type, category, currency, range })),
    [category, currency, query, range, transactions, type]
  );
  const groups = useMemo(() => groupByDay(filtered, snapshot.today), [filtered, snapshot.today]);
  const summary = useMemo(
    () => summarize(filtered, range, snapshot.today, currency),
    [currency, filtered, range, snapshot.today]
  );
  const pattern = useMemo(() => weekdayPattern(filtered, currency), [currency, filtered]);

  const headerWhen =
    preset === "period" && snapshot.payPeriod
      ? `Este período · ${shortRangeLabel(range)}`
      : preset === "custom"
        ? shortRangeLabel(range)
        : `Este mes · ${shortRangeLabel(range)}`;

  const filterSubtitle = useMemo(() => {
    if (preset === "period" && !snapshot.payPeriod) return "Sin período de sueldo, miro el mes.";
    const parts: string[] = [];
    if (type === "expense") parts.push("Gastos");
    if (type === "income") parts.push("Ingresos");
    if (category !== "all") parts.push(CATEGORY_LABELS[category]);
    if (currency === "ARS") parts.push("Pesos");
    if (currency === "USD") parts.push("Dólares");
    const needle = query.trim();
    if (needle) parts.push(`“${needle}”`);
    return parts.length > 0 ? parts.join(" · ") : "Todo lo que entra en estas fechas";
  }, [category, currency, preset, query, snapshot.payPeriod, type]);

  const activeCount =
    (type !== "all" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (currency !== "all" ? 1 : 0) +
    (preset !== "period" ? 1 : 0);

  function choosePreset(next: RangePreset) {
    setPreset(next);
    if (next === "custom" && (!customFrom || !customTo)) {
      setCustomFrom(range.from);
      setCustomTo(range.to < snapshot.today ? range.to : snapshot.today);
    }
  }

  function clearFilters() {
    setType("all");
    setCategory("all");
    setCurrency("all");
    setPreset("period");
    setQuery("");
  }

  function armRemove(id: string) {
    if (confirmRef.current === id) {
      confirmRef.current = null;
      setConfirmId(null);
      removeTransaction(id);
      return;
    }
    confirmRef.current = id;
    setConfirmId(id);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      if (confirmRef.current !== id) return;
      confirmRef.current = null;
      setConfirmId(null);
    }, 4000);
  }

  const filterFields = (
    <FilterFields
      type={type}
      category={category}
      currency={currency}
      preset={preset}
      customFrom={customFrom}
      customTo={customTo}
      onType={setType}
      onCategory={setCategory}
      onCurrency={setCurrency}
      onPreset={choosePreset}
      onCustomFrom={setCustomFrom}
      onCustomTo={setCustomTo}
    />
  );

  return (
    <div ref={pageRef} className="min-w-0" style={{ ["--mov-head" as string]: "72px" }}>
      <header ref={headRef} className="page-head">
        <div className="min-w-0">
          <h1 className="truncate text-[1.35rem] font-semibold tracking-[-0.03em]">Movimientos</h1>
          <p className="text-[13px] text-[#9aa1ab]">{headerWhen}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="gap-2 rounded-full" />}>
            <Plus size={15} />
            <span className="hidden min-[380px]:inline">Nuevo movimiento</span>
            <span className="min-[380px]:hidden">Nuevo</span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo movimiento</DialogTitle>
            </DialogHeader>
            <TransactionForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      <div className="mx-auto grid w-full min-w-0 max-w-6xl grid-cols-1 items-stretch gap-4 px-4 py-4 sm:px-6 sm:py-6 xl:grid-cols-2">
        <section className="viz-card xl:col-span-2">
          <MoneyAgreement />
        </section>

        <section className="viz-card xl:col-span-2">
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0">
              <h2 className="truncate text-[17px] font-semibold tracking-[-0.03em] text-[#1c1f26]">En este filtro</h2>
              <p className="mt-0.5 text-[13px] leading-snug text-[#9aa1ab]">{filterSubtitle}</p>
              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3">
                <figure className="col-span-2 min-w-0 sm:col-span-1">
                  <figcaption className="text-[13px] text-[#9aa1ab]">Total</figcaption>
                  <p
                    className={cn(
                      "num mt-1 text-[clamp(1.5rem,5vw,1.85rem)] text-[#16181d]",
                      summary.total > 0 && "text-[#1f9d55]"
                    )}
                  >
                    {signedFormat(summary.total, summary.currency)}
                  </p>
                </figure>
                <figure className="min-w-0">
                  <figcaption className="text-[13px] text-[#9aa1ab]">Cantidad</figcaption>
                  <span className="mt-1 block text-[clamp(0.82rem,3.2vw,1rem)] font-semibold tabular-nums text-[#1c1f26]">
                    {summary.count.toLocaleString("es-AR")}
                  </span>
                </figure>
                <figure className="min-w-0">
                  <figcaption className="text-[13px] text-[#9aa1ab]">Promedio por día</figcaption>
                  <span className="mt-1 block truncate text-[clamp(0.82rem,3.2vw,1rem)] font-semibold tabular-nums text-[#1c1f26]">
                    {signedFormat(summary.average, summary.currency)}
                  </span>
                </figure>
              </div>
              {summary.usdAside ? (
                <p className="mt-3 text-[13px] leading-snug text-[#6d7480]">Los dólares no entran en este total.</p>
              ) : null}
            </div>
            <div className="hidden min-w-0 md:block">
              <h2 className="truncate text-[17px] font-semibold tracking-[-0.03em] text-[#1c1f26]">{pattern.title}</h2>
              <p className="mt-0.5 text-[13px] leading-snug text-[#9aa1ab]">
                {pattern.currency === "USD" ? "Dólares del filtro" : "Pesos del filtro"}
              </p>
              <div className="mt-4">
                <WeekdayBars pattern={pattern} />
              </div>
            </div>
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-3 xl:col-span-2">
          <div className="flex min-w-0 items-center gap-2">
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-[#f5f6f8] px-3 duration-200 ease-out focus-within:ring-1 focus-within:ring-black/[0.08] motion-reduce:transition-none md:max-w-sm">
              <Search size={15} className="shrink-0 text-[#9aa1ab]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar comercio o descripción"
                aria-label="Buscar comercio o descripción"
                autoComplete="off"
                className="h-8 w-auto min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
              />
              {query ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setQuery("")}
                  aria-label="Borrar búsqueda"
                  className="size-6 text-[#9aa1ab]"
                >
                  <X size={14} />
                </Button>
              ) : null}
            </label>
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="secondary" className="h-9 shrink-0 gap-1.5 rounded-full bg-[#f5f6f8] px-3 text-[13px] md:hidden" />
                }
              >
                <SlidersHorizontal size={14} />
                Filtros{activeCount > 0 ? ` · ${activeCount}` : ""}
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="max-h-[85dvh] overflow-y-auto rounded-t-[28px] pb-[max(1rem,env(safe-area-inset-bottom))]"
              >
                <SheetHeader>
                  <SheetTitle className="text-[17px] font-semibold tracking-[-0.03em] text-[#1c1f26]">Filtros</SheetTitle>
                </SheetHeader>
                <div className="min-w-0 px-4 pb-2">{filterFields}</div>
                <div className="flex items-center justify-between gap-3 px-4 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="text-[#6d7480]">
                    Limpiar
                  </Button>
                  <SheetClose render={<Button className="rounded-full px-4" />}>Listo</SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden min-w-0 md:block">
            <FilterFields
              dense
              type={type}
              category={category}
              currency={currency}
              preset={preset}
              customFrom={customFrom}
              customTo={customTo}
              onType={setType}
              onCategory={setCategory}
              onCurrency={setCurrency}
              onPreset={choosePreset}
              onCustomFrom={setCustomFrom}
              onCustomTo={setCustomTo}
            />
          </div>

          {activeCount > 0 ? (
            <div className="flex flex-wrap gap-1.5 md:hidden">
              {type !== "all" ? (
                <Chip selected onClick={() => setType("all")}>
                  {type === "expense" ? "Gastos" : "Ingresos"} ×
                </Chip>
              ) : null}
              {category !== "all" ? (
                <Chip selected onClick={() => setCategory("all")}>
                  {CATEGORY_LABELS[category]} ×
                </Chip>
              ) : null}
              {currency !== "all" ? (
                <Chip selected onClick={() => setCurrency("all")}>
                  {currency === "ARS" ? "Pesos" : currency === "USD" ? "Dólares" : "Ambas"} ×
                </Chip>
              ) : null}
              {preset !== "period" ? (
                <Chip selected onClick={() => setPreset("period")}>
                  {preset === "month" ? "Este mes" : "Fechas"} ×
                </Chip>
              ) : null}
            </div>
          ) : null}

          {groups.length === 0 ? (
            <div className="viz-card px-4 py-10 text-center">
              <p className="text-[15px] font-medium text-[#1c1f26]">
                {transactions.length === 0 ? "Todavía no hay movimientos" : "Nada con estos filtros"}
              </p>
              <p className="mt-1 text-[13px] text-[#6d7480]">
                {transactions.length === 0
                  ? "Cargá uno con el botón de arriba."
                  : "Probá otra búsqueda o cambiá las fechas."}
              </p>
            </div>
          ) : (
            <div className="flex min-w-0 flex-col gap-4">
              {groups.map((group) => {
                const usdOnly = currency === "USD" || (!group.hasArs && group.hasUsd);
                const net = usdOnly ? group.usdNet : group.arsNet;
                const code = usdOnly ? "USD" : "ARS";
                return (
                  <section key={group.day} className="min-w-0">
                    <div className="sticky top-[var(--mov-head)] z-10 flex items-baseline justify-between gap-3 bg-background py-2">
                      <h2 className="min-w-0 truncate text-[14px] font-medium text-[#1c1f26]">{group.label}</h2>
                      <p className="shrink-0 text-right leading-tight">
                        <span
                          className={cn(
                            "block text-[13px] font-semibold tabular-nums text-[#1c1f26]",
                            net > 0 && "text-[#1f9d55]"
                          )}
                        >
                          {signedFormat(net, code)}
                        </span>
                        {!usdOnly && group.hasUsd ? (
                          <span className="mt-0.5 block text-[12px] font-medium text-[#9aa1ab] tabular-nums">
                            {signedFormat(group.usdNet, "USD")}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <ul className="viz-card divide-y divide-black/[0.04]" style={{ padding: 0 }}>
                      {group.transactions.map((transaction) => (
                        <MovementRow
                          key={transaction.id}
                          transaction={transaction}
                          confirming={confirmId === transaction.id}
                          onArm={() => armRemove(transaction.id)}
                          onRemove={() => {
                            confirmRef.current = null;
                            setConfirmId(null);
                            removeTransaction(transaction.id);
                          }}
                        />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
