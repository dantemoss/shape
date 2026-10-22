export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

/**
 * Next.js inlinea las variables `NEXT_PUBLIC_` en el cliente durante `next build`.
 * Hay que definirlas en Vercel antes de desplegar, no solo en runtime.
 */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
