"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ArrowLeftRight, Target,
  Banknote, HeartPulse, User, CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShapeStore } from "@/lib/store";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/salary", label: "Sueldo", icon: Banknote },
  { href: "/cards", label: "Tarjetas", icon: CreditCard },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/health", label: "Higiene", icon: HeartPulse },
];

export function Sidebar() {
  const pathname = usePathname();
  const userProfile = useShapeStore((s) => s.userProfile);

  return (
    <aside className="fixed left-0 top-0 h-screen w-52 border-r border-border flex flex-col py-5 bg-sidebar z-10">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 mb-7">
        <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center shrink-0">
          <span className="text-background text-xs font-medium">S</span>
        </div>
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
                  ? "bg-income/10 text-income font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon
                size={15}
                strokeWidth={active ? 2 : 1.6}
                className={active ? "text-income" : ""}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 mt-4 border-t border-border pt-4">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
            pathname === "/profile"
              ? "bg-income/10 text-income font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          )}
        >
          {userProfile?.avatar ? (
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User size={13} />
            </div>
          )}
          <span className="truncate">{userProfile?.name ?? "Perfil"}</span>
        </Link>
      </div>
    </aside>
  );
}
