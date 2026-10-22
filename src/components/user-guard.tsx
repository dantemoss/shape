"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShapeStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ConfigMissing, LoadingScreen } from "@/components/loading-screen";

export function UserGuard({ children }: { children: React.ReactNode }) {
  const authStatus = useShapeStore((s) => s.authStatus);
  const ready = useShapeStore((s) => s.ready);
  const router = useRouter();

  useEffect(() => {
    if (isSupabaseConfigured() && authStatus === "anonymous") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  if (!isSupabaseConfigured()) return <ConfigMissing />;
  if (authStatus === "loading" || !ready) return <LoadingScreen />;
  if (authStatus !== "authenticated") return null;

  return <>{children}</>;
}
