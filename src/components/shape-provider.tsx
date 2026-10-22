"use client";

import { useEffect } from "react";
import { bootstrap, invalidateSession } from "@/lib/session";
import { getSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function ShapeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      invalidateSession();
      return;
    }

    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        if (event === "INITIAL_SESSION" || event === "SIGNED_OUT") invalidateSession();
        return;
      }
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        const userId = session.user.id;
        setTimeout(() => {
          void bootstrap(userId);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
