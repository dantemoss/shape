"use client";

import { useEffect } from "react";
import { buildPreviewData } from "@/lib/preview-data";
import { previewMode } from "@/lib/preview";
import { acceptSession, bootstrap, invalidateSession, startLiveSync, stopLiveSync } from "@/lib/session";
import { useShapeStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function ShapeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (previewMode) {
      useShapeStore.setState({
        ...buildPreviewData(),
        userId: "preview",
        authStatus: "authenticated",
        ready: true,
        localOnly: true,
        ledgerReady: true,
        syncError: null,
        importNotice: null,
        legacyPending: false,
        importingLegacy: false,
      });
      return;
    }

    if (!isSupabaseConfigured()) {
      invalidateSession();
      return;
    }

    const supabase = getSupabase();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user.id ?? null;
      const decision = acceptSession(event, userId);
      if (decision === "signout") {
        invalidateSession();
        return;
      }
      if (!userId) return;
      if (decision === "bootstrap") {
        // Fuera del callback: GoTrue espera a que vuelva antes de soltar la sesión.
        setTimeout(() => {
          void bootstrap(userId);
        }, 0);
        return;
      }
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        setTimeout(() => {
          const state = useShapeStore.getState();
          if (state.ready && state.userId === userId) startLiveSync(userId);
        }, 0);
      }
    });

    return () => {
      subscription.unsubscribe();
      stopLiveSync();
    };
  }, []);

  return <>{children}</>;
}
