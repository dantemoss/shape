"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  HeartPulse,
  House,
  LayoutGrid,
  RefreshCw,
  Target,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShapeStore } from "@/lib/store";
import { ShapeLogo } from "@/components/shape-logo";

const PRIMARY = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/transactions", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/salary", label: "Sueldo", icon: Banknote },
  { href: "/health", label: "Higiene", icon: HeartPulse },
];

const MORE = [
  { href: "/cards", label: "Tarjetas", icon: CreditCard },
  { href: "/subscriptions", label: "Suscripciones", icon: RefreshCw },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/profile", label: "Perfil", icon: User },
];

const DESKTOP = [...PRIMARY, ...MORE.filter((item) => item.href !== "/profile")];

export function Sidebar() {
  const pathname = usePathname();
  const userProfile = useShapeStore((s) => s.userProfile);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE.some((item) => item.href === pathname);

  return (
    <>
      <aside className="fixed top-0 left-0 z-20 hidden h-dvh w-56 flex-col border-r border-black/[0.05] bg-white py-5 md:flex">
        <div className="mb-7 flex items-center gap-2.5 px-5">
          <ShapeLogo size={28} />
          <span className="text-[15px] font-semibold tracking-[-0.03em]">Shape</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {DESKTOP.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors",
                  active ? "bg-[#eef2ff] font-medium text-[#2f48a1]" : "text-[#6d7480] hover:bg-[#f6f7f9] hover:text-[#1c1f26]"
                )}
              >
                <Icon size={16} strokeWidth={active ? 2.1 : 1.7} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 border-t border-black/[0.05] px-3 pt-4">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px]",
              pathname === "/profile" ? "bg-[#eef2ff] font-medium text-[#2f48a1]" : "text-[#6d7480] hover:bg-[#f6f7f9]"
            )}
          >
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} alt="" className="size-7 rounded-full object-cover" />
            ) : (
              <span className="flex size-7 items-center justify-center rounded-full bg-[#f3f4f6]">
                <User size={14} />
              </span>
            )}
            <span className="truncate">{userProfile?.name || "Perfil"}</span>
          </Link>
        </div>
      </aside>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-white/95 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] shadow-[0_-10px_30px_rgba(15,23,42,0.05)] backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5">
          {PRIMARY.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-1 px-0.5 py-1.5",
                  active ? "text-[#2f48a1]" : "text-[#8b919c]"
                )}
              >
                <Icon size={21} strokeWidth={active ? 2.2 : 1.7} />
                <span className="max-w-full truncate text-[11px] leading-none font-medium tracking-[-0.03em]">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-[52px] flex-col items-center justify-center gap-1 px-0.5 py-1.5",
              moreActive ? "text-[#2f48a1]" : "text-[#8b919c]"
            )}
          >
            <LayoutGrid size={21} strokeWidth={moreActive ? 2.2 : 1.7} />
            <span className="text-[11px] leading-none font-medium tracking-[-0.03em]">Más</span>
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/30" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e6e8ec]" />
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[15px] font-semibold">Más</p>
              <button type="button" onClick={() => setMoreOpen(false)} className="flex size-9 items-center justify-center rounded-full bg-[#f5f6f8]" aria-label="Cerrar">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MORE.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex min-h-14 items-center gap-3 rounded-2xl px-3",
                      active ? "bg-[#eef2ff] text-[#2f48a1]" : "bg-[#f6f7f9] text-[#1c1f26]"
                    )}
                  >
                    {href === "/profile" && userProfile?.avatar ? (
                      <img src={userProfile.avatar} alt="" className="size-8 rounded-full object-cover" />
                    ) : (
                      <Icon size={18} />
                    )}
                    <span className="text-[14px] font-medium">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
