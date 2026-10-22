import { getSupabase } from "./supabase/client";
import type { UserProfile } from "./types";

export type SignUpResult =
  | { status: "session"; userId: string }
  | { status: "confirm" };

const PENDING_NAME = "shape-pending-name";
const PENDING_AVATAR = "shape-pending-avatar";

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function stashPendingProfile(profile: UserProfile) {
  const storage = browserStorage();
  if (!storage) return;
  try {
    storage.setItem(PENDING_NAME, profile.name);
    if (profile.avatar) storage.setItem(PENDING_AVATAR, profile.avatar);
    else storage.removeItem(PENDING_AVATAR);
  } catch {
    // Una foto grande puede no entrar. El nombre ya viaja en la cuenta.
  }
}

export function peekPendingProfile(): Partial<UserProfile> | null {
  const storage = browserStorage();
  if (!storage) return null;
  try {
    const name = storage.getItem(PENDING_NAME) ?? "";
    const avatar = storage.getItem(PENDING_AVATAR);
    if (!name && !avatar) return null;
    return { name, avatar };
  } catch {
    return null;
  }
}

export function clearPendingProfile() {
  const storage = browserStorage();
  if (!storage) return;
  try {
    storage.removeItem(PENDING_NAME);
    storage.removeItem(PENDING_AVATAR);
  } catch {
    // Si el storage está bloqueado, el próximo ingreso vuelve a intentar.
  }
}

export async function signIn(email: string, password: string): Promise<string> {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(translateAuthError(error.message));
  if (!data.user) throw new Error("No pudimos iniciar la sesión.");
  return data.user.id;
}

export async function signUp(email: string, password: string, name: string): Promise<SignUpResult> {
  const origin = typeof window === "undefined" ? undefined : window.location.origin;
  const { data, error } = await getSupabase().auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { name },
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
    },
  });
  if (error) throw new Error(translateAuthError(error.message));
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error("Ya existe una cuenta con ese email. Ingresá con tu contraseña.");
  }
  if (!data.session || !data.user) return { status: "confirm" };
  return { status: "session", userId: data.user.id };
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw new Error(translateAuthError(error.message));
}

function translateAuthError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) return "Email o contraseña incorrectos.";
  if (text.includes("email not confirmed")) return "Confirmá el email antes de ingresar.";
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "Ya existe una cuenta con ese email. Ingresá con tu contraseña.";
  }
  if (text.includes("password")) return "La contraseña tiene que tener al menos 6 caracteres.";
  if (text.includes("rate limit") || text.includes("too many")) return "Esperá un momento y volvé a intentar.";
  if (text.includes("valid email") || text.includes("unable to validate email")) return "El email no es válido.";
  return "No pudimos conectar con tu cuenta. Revisá los datos y la conexión.";
}
