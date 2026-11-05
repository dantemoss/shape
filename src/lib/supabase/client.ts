"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";
import { fetchWithDeadline } from "./fetch-with-deadline";

let browserClient: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  browserClient ??= createBrowserClient(env.url, env.anonKey, {
    global: {
      fetch: (input, init) => fetchWithDeadline(input, init),
    },
  });
  return browserClient;
}
