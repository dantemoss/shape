"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Target, Banknote, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/salary", label: "Sueldo", icon: Banknote },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/health", label: "Higiene", icon: HeartPulse },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-14 border-r border-border flex flex-col items-center py-5 gap-1 bg-sidebar z-10">
      {/* Logo mark */}
      <div className="mb-5 w-8 h-8 rounded-lg bg-foreground flex items-center justify-center shrink-0">
        <span className="text-background text-xs font-bold">S</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-1 flex-1 w-full px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Tooltip key={href}>
              <TooltipTrigger
                render={
                  <Link
                    href={href}
                    className={cn(
                      "w-full flex items-center justify-center h-9 rounded-lg transition-all duration-150",
                      active
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                    )}
                  />
                }
              >
                <Icon size={16} />
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
}
