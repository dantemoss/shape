"use client";

import { useEffect } from "react";
import { buildPreviewData } from "@/lib/preview-data";
import { previewMode } from "@/lib/preview";
import { bootstrap, invalidateSession } from "@/lib/session";
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
