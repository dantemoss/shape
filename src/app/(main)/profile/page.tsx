"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, ChevronRight, CreditCard, ImageIcon, LogOut, RefreshCw, User } from "lucide-react";
import { signOut } from "@/lib/auth";
import { monthKey, todayISO } from "@/lib/dates";
import { formatIso } from "@/lib/format-date";
import { previewMode } from "@/lib/preview";
import { invalidateSession, retryLegacyImport } from "@/lib/session";
import { useShapeStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";
import { ShapeLogo } from "@/components/shape-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const countFormat = new Intl.NumberFormat("es-AR");

export default function ProfilePage() {
  const userProfile = useShapeStore((s) => s.userProfile);
  const setUserProfile = useShapeStore((s) => s.setUserProfile);
  const legacyPending = useShapeStore((s) => s.legacyPending);
  const importingLegacy = useShapeStore((s) => s.importingLegacy);
  const transactions = useShapeStore((s) => s.transactions);
  const creditCards = useShapeStore((s) => s.creditCards);
  const subscriptions = useShapeStore((s) => s.subscriptions);
  const goals = useShapeStore((s) => s.goals);
  const router = useRouter();

  const [name, setName] = useState(userProfile?.name ?? "");
  const [avatar, setAvatar] = useState<string | null>(userProfile?.avatar ?? null);
  const [saved, setSaved] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [accountSince, setAccountSince] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const serverProfile = useRef<{ name: string; avatar: string | null } | null>(null);

  useEffect(() => {
    const next = { name: userProfile?.name ?? "", avatar: userProfile?.avatar ?? null };
    const previous = serverProfile.current;
    const dirtyDraft = previous ? name !== previous.name || avatar !== previous.avatar : false;
    serverProfile.current = next;
    if (dirtyDraft) return;
    setName(next.name);
    setAvatar(next.avatar);
  }, [userProfile?.name, userProfile?.avatar, name, avatar]);

  useEffect(() => {
    if (!previewMode) return;
    setEmail("tin@correo.com");
    setConfirmed(true);
  }, []);

  useEffect(() => {
    if (previewMode || !isSupabaseConfigured()) return;
    let cancel = false;
    getSupabase()
      .auth.getUser()
      .then(({ data }) => {
        if (cancel || !data.user) return;
        setEmail(data.user.email ?? null);
        setConfirmed(Boolean(data.user.email_confirmed_at));
        setAccountSince(data.user.created_at ?? null);
      })
      .catch((err) => console.error(err));
    return () => {
      cancel = true;
    };
  }, []);

  const savedName = userProfile?.name ?? "";
  const savedAvatar = userProfile?.avatar ?? null;
  const dirty = name !== savedName || avatar !== savedAvatar;
  const displayName = savedName.trim() || "Tu perfil";

  const stats = useMemo(() => {
    const month = monthKey(todayISO());
    const movements = transactions.filter((tx) => monthKey(tx.date) === month).length;
    const cards = creditCards.length;
    const activeSubs = subscriptions.filter((sub) => sub.active).length;
    const dates = [
      accountSince,
      ...transactions.map((tx) => tx.date),
      ...creditCards.map((card) => card.createdAt),
      ...subscriptions.map((sub) => sub.createdAt),
      ...goals.map((goal) => goal.createdAt),
    ].filter((value): value is string => Boolean(value && /^\d{4}-\d{2}-\d{2}/.test(value)));
    const since = dates.sort()[0] ?? null;
    return { movements, cards, activeSubs, since };
  }, [accountSince, transactions, creditCards, subscriptions, goals]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  function cancelEdits() {
    setName(savedName);
    setAvatar(savedAvatar);
    setSaved(false);
    setEditingName(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await setUserProfile({ name: name.trim(), avatar });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // El aviso de la pantalla muestra el error.
    }
  }

  async function handleLogout() {
    try {
      await signOut();
    } catch (err) {
      console.error(err);
    } finally {
      invalidateSession();
      router.replace("/login");
    }
  }

  function openPhoto() {
    fileRef.current?.click();
  }

  return (
    <div className="min-h-full bg-[#fbfafe] dark:bg-background md:bg-transparent">
      <form
        onSubmit={handleSave}
        className="mx-auto w-full max-w-[680px] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6 sm:px-6 md:px-0 md:pt-6 md:pb-10"
      >
        <h1 className="mb-4 hidden text-[1.35rem] font-semibold tracking-[-0.03em] text-[#16181d] md:block dark:text-foreground">
          Mi perfil
        </h1>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" tabIndex={-1} onChange={handleFileChange} />

        <section className="profile-card profile-rise hidden overflow-hidden rounded-[28px] border border-black/10 bg-[#14161c] text-[#f4f5f7] shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_40px_rgba(15,23,42,0.08)] md:block">
          <div className="profile-band" />
          <div className="px-5 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="-mt-9">
                <ProfileMark avatar={avatar} onPick={openPhoto} />
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-[13px] text-[#e7e9ee] transition-colors duration-200 hover:bg-white/8"
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <h2 className="truncate text-[17px] font-semibold tracking-[-0.03em]">{displayName}</h2>
              {confirmed ? (
                <span className="inline-flex shrink-0 items-center rounded-full bg-white/10 px-2 py-0.5 text-[12px] text-[#d5d8e2]">
                  Confirmado
                </span>
              ) : null}
            </div>
            {email ? <p className="mt-1 truncate text-[13px] text-[#9aa3b2]">{email}</p> : null}

            <div className="mt-4 grid grid-cols-4 gap-3 border-y border-white/10 py-3.5">
              <Stat label="Miembro desde" value={stats.since ? formatIso(stats.since, "MMM yyyy") : "—"} />
              <Stat label="Movimientos del mes" value={countFormat.format(stats.movements)} />
              <Stat label="Tarjetas" value={countFormat.format(stats.cards)} />
              <Stat label="Suscripciones" value={countFormat.format(stats.activeSubs)} />
            </div>

            <div className="mt-1">
              <DeskField label="Nombre" htmlFor="profile-name">
                <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" autoComplete="name" />
              </DeskField>
              {email ? (
                <DeskField label="Email" htmlFor="profile-email">
                  <Input id="profile-email" value={email} readOnly aria-readonly />
                </DeskField>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              {dirty ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 border-white/15 bg-transparent px-3.5 text-[13px] text-[#e7e9ee] hover:bg-white/8 hover:text-white"
                  onClick={cancelEdits}
                >
                  Cancelar
                </Button>
              ) : null}
              <Button type="submit" className="h-9 px-4 text-[13px]" disabled={!dirty || !name.trim()}>
                {saved ? "Guardado" : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </section>

        <div className="md:hidden">
          <p className="text-center text-[17px] font-semibold tracking-[-0.02em] text-[#16181d] dark:text-foreground">Perfil</p>
          <div className="mt-5 flex justify-center">
            <ProfileMark avatar={avatar} onPick={openPhoto} large />
          </div>
          <h2 className="mt-4 text-center text-[1.7rem] font-bold leading-tight tracking-[-0.03em] text-[#16181d] dark:text-foreground">
            Hola, {displayName}
          </h2>
          {email ? <p className="mt-1 text-center text-[14px] text-[#9aa1ab]">{email}</p> : null}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Tile href="/cards" title="Tarjetas" caption={countCaption(stats.cards, "cargada", "cargadas")} icon={<CreditCard size={16} strokeWidth={1.75} />} />
            <Tile href="/subscriptions" title="Suscripciones" caption={countCaption(stats.activeSubs, "activa", "activas")} icon={<RefreshCw size={16} strokeWidth={1.75} />} />
          </div>

          {legacyPending ? (
            <button
              type="button"
              className="mt-4 flex w-full items-center gap-3 rounded-[20px] bg-[#f3f4f6] px-4 py-3.5 text-left dark:bg-muted"
              disabled={importingLegacy}
              onClick={() => void retryLegacyImport()}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-white text-[#1c1f26]">
                <ImageIcon size={16} strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-[#16181d] dark:text-foreground">Datos de este navegador</span>
                <span className="mt-0.5 block text-[13px] text-[#9aa1ab]">{importingLegacy ? "Importando…" : "Traelos a tu cuenta"}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-[#9aa1ab]" />
            </button>
          ) : null}

          <h3 className="mt-6 text-[1.35rem] font-semibold tracking-[-0.03em] text-[#16181d] dark:text-foreground">Tu cuenta</h3>
          <div className="mt-3 overflow-hidden rounded-[22px] bg-[#f3f4f6] dark:bg-muted">
            {editingName ? (
              <div className="flex min-h-[64px] items-center gap-3 px-4">
                <User size={18} strokeWidth={1.75} className="shrink-0 text-[#1c1f26] dark:text-foreground" />
                <div className="min-w-0 flex-1">
                  <label htmlFor="profile-name-m" className="block text-[15px] font-semibold leading-none text-[#16181d] dark:text-foreground">
                    Nombre
                  </label>
                  <input
                    id="profile-name-m"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    autoComplete="name"
                    autoFocus
                    onBlur={() => {
                      if (!dirty) setEditingName(false);
                    }}
                    className="mt-1 w-full bg-transparent text-base text-[#3a4150] outline-none placeholder:text-[#9aa1ab] dark:text-foreground"
                  />
                </div>
              </div>
            ) : (
              <button type="button" className="flex min-h-[64px] w-full items-center gap-3 px-4 text-left" onClick={() => setEditingName(true)}>
                <User size={18} strokeWidth={1.75} className="shrink-0 text-[#1c1f26] dark:text-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold leading-none text-[#16181d] dark:text-foreground">Nombre</span>
                  <span className="mt-1 block truncate text-[13px] text-[#9aa1ab]">{savedName || "Sin nombre"}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-[#9aa1ab]" />
              </button>
            )}
            <div className="mx-4 h-px bg-black/[0.06] dark:bg-white/10" />
            <button type="button" className="flex min-h-[64px] w-full items-center gap-3 px-4 text-left" onClick={openPhoto}>
              <ImageIcon size={18} strokeWidth={1.75} className="shrink-0 text-[#1c1f26] dark:text-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-none text-[#16181d] dark:text-foreground">Foto</span>
                <span className="mt-1 block text-[13px] text-[#9aa1ab]">{avatar ? "Cambiar" : "Subir, si querés"}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-[#9aa1ab]" />
            </button>
          </div>

          {dirty ? (
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="outline" className="h-11 flex-1 rounded-2xl text-[15px]" onClick={cancelEdits}>
                Cancelar
              </Button>
              <Button type="submit" className="h-11 flex-[1.4] rounded-2xl text-[15px]" disabled={!name.trim()}>
                {saved ? "Guardado" : "Guardar"}
              </Button>
            </div>
          ) : null}

          <h3 className="mt-6 text-[1.35rem] font-semibold tracking-[-0.03em] text-[#16181d] dark:text-foreground">General</h3>
          <div className="mt-3 overflow-hidden rounded-[22px] bg-[#f3f4f6] dark:bg-muted">
            <button type="button" className="flex min-h-[64px] w-full items-center gap-3 px-4 text-left" onClick={handleLogout}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-white text-[#a35a5a] dark:bg-card">
                <LogOut size={16} strokeWidth={1.75} />
              </span>
              <span className="flex-1 text-[15px] font-semibold text-[#16181d] dark:text-foreground">Cerrar sesión</span>
              <ChevronRight size={18} className="shrink-0 text-[#9aa1ab]" />
            </button>
          </div>
        </div>

        {legacyPending ? (
          <div className="mt-4 hidden rounded-[20px] border border-black/[0.06] bg-white px-4 py-4 md:block dark:bg-card">
            <p className="text-[15px] font-semibold text-[#16181d] dark:text-foreground">Datos de este navegador</p>
            <p className="mt-1 text-[13px] text-[#6d7480]">Había datos guardados acá, de antes de la cuenta. Podés traerlos.</p>
            <Button type="button" variant="outline" className="mt-3 h-9" disabled={importingLegacy} onClick={() => void retryLegacyImport()}>
              {importingLegacy ? "Importando…" : "Importar"}
            </Button>
          </div>
        ) : null}

        </form>
    </div>
  );
}

function countCaption(count: number, one: string, many: string) {
  return `${countFormat.format(count)} ${count === 1 ? one : many}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="min-h-8 text-[13px] leading-snug text-[#aeb6c6]">{label}</p>
      <p className="mt-1.5 truncate text-[15px] font-semibold leading-none tracking-[-0.03em] whitespace-nowrap tabular-nums text-[#f4f5f7]">{value}</p>
    </div>
  );
}

function DeskField({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4 border-b border-white/10 py-3.5">
      <label htmlFor={htmlFor} className="text-[13px] text-[#c4c8d4]">
        {label}
      </label>
      {children}
    </div>
  );
}

function Tile({ href, title, caption, icon }: { href: string; title: string; caption: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="min-w-0 overflow-hidden rounded-[20px] bg-[#f3f4f6] px-3 py-3 dark:bg-muted">
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 text-[15px] font-semibold leading-tight text-[#16181d] dark:text-foreground">{title}</span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-white text-[#1c1f26] dark:bg-card dark:text-foreground">
          {icon}
        </span>
      </span>
      <span className="mt-1 block break-words text-[13px] leading-snug tabular-nums text-[#9aa1ab]">{caption}</span>
    </Link>
  );
}

function ProfileMark({
  avatar,
  onPick,
  large = false,
}: {
  avatar: string | null;
  onPick: () => void;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={avatar ? "Cambiar foto" : "Subir foto"}
      className={cn("relative shrink-0 rounded-full", large ? "size-[92px]" : "size-[68px]")}
    >
      <span
        className={cn(
          "flex size-full items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_10px_28px_rgba(47,72,161,0.18)]",
          !large && "ring-4 ring-[#14161c] shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
        )}
      >
        {avatar ? <img src={avatar} alt="" className="size-full object-cover" /> : <ShapeLogo size={large ? 42 : 34} />}
      </span>
      <span className="absolute -right-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#1c1f26] shadow-[0_2px_6px_rgba(15,23,42,0.12)]">
        <Camera size={13} strokeWidth={1.75} />
      </span>
    </button>
  );
}

