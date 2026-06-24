"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ArrowLeftRight, Target,
  Banknote, HeartPulse, User, CreditCard, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShapeStore } from "@/lib/store";
import { ShapeLogo } from "@/components/shape-logo";

const NAV_ITEMS = [
  { href: "/",              label: "Dashboard",     icon: LayoutDashboard },
  { href: "/transactions",  label: "Movimientos",   icon: ArrowLeftRight },
  { href: "/salary",        label: "Sueldo",        icon: Banknote },
  { href: "/cards",         label: "Tarjetas",      icon: CreditCard },
  { href: "/subscriptions", label: "Suscripciones", icon: RefreshCw },
  { href: "/goals",         label: "Metas",         icon: Target },
  { href: "/health",        label: "Higiene",       icon: HeartPulse },
];

export function Sidebar() {
  const pathname    = usePathname();
  const userProfile = useShapeStore((s) => s.userProfile);

  return (
    <>
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-52 border-r border-border flex-col py-5 bg-sidebar z-20">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 mb-7">
          <ShapeLogo size={28} />
          <span className="font-medium text-sm tracking-tight">Shape</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1 px-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                  active
                    ? "bg-brand/10 text-brand font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon size={15} strokeWidth={active ? 2 : 1.6} className={active ? "text-brand" : ""} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 mt-4 border-t border-border pt-4">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
              pathname === "/profile"
                ? "bg-brand/10 text-brand font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            )}
          >
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} alt={userProfile.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User size={13} />
              </div>
            )}
            <span className="truncate">{userProfile?.name ?? "Perfil"}</span>
          </Link>
        </div>
      </aside>

      {/* ── Mobile bottom nav (hidden on desktop) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-background border-t border-border flex items-center">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors",
                active ? "text-brand" : "text-muted-foreground"
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
              <span className="text-[9px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
        {/* Profile */}
        <Link
          href="/profile"
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors",
            pathname === "/profile" ? "text-brand" : "text-muted-foreground"
          )}
        >
          {userProfile?.avatar ? (
            <img src={userProfile.avatar} alt="" className="w-[18px] h-[18px] rounded-full object-cover" />
          ) : (
            <User size={18} strokeWidth={pathname === "/profile" ? 2.2 : 1.6} />
          )}
          <span className="text-[9px] font-medium leading-none">Perfil</span>
        </Link>
      </nav>
    </>
  );
}
