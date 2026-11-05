"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { clearPendingProfile, peekPendingProfile } from "./auth";
import { importSnapshot, loadAll, updateProfile } from "./db";
import {
  LEGACY_STORAGE_KEY,
  legacyHasData,
  legacyImportedFlag,
  parseLegacySnapshot,
  summarizeLegacy,
} from "./legacy-snapshot";
import { acceptSession, canSoftRefresh, forgetSession, rememberSession } from "./session-gate";
import { pendingWriteCount, useShapeStore, type ImportNotice } from "./store";
import { getSupabase } from "./supabase/client";

let chain: Promise<void> = Promise.resolve();
let generation = 0;
let inflight: Promise<void> | null = null;
let inflightUser: string | null = null;
let refreshCurrent: Promise<void> | null = null;
let refreshAgain = false;
let stopLive: (() => void) | null = null;
let liveUser: string | null = null;

const REFRESH_EVERY_MS = 15_000;
const LOAD_ERROR = "No se pudieron cargar tus datos.";
const USER_TABLES = [
  "expenses",
  "incomes",
  "goals",
  "salary_configs",
  "salary_payments",
  "credit_cards",
  "card_installments",
  "subscriptions",
  "accounts",
  "balance_adjustments",
] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export { acceptSession };

export interface LegacyImportOutcome {
  didImport: boolean;
  pending: boolean;
  notice: ImportNotice | null;
}

function enqueue(task: () => Promise<void>): Promise<void> {
  const run = chain.then(task);
  chain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export function invalidateSession() {
  generation += 1;
  inflight = null;
  inflightUser = null;
  refreshCurrent = null;
  refreshAgain = false;
  forgetSession();
  stopLiveSync();
  useShapeStore.getState().resetSession();
}

export function bootstrap(userId: string): Promise<void> {
  if (inflight && inflightUser === userId) return inflight;
  const gen = generation;
  inflightUser = userId;
  rememberSession(userId);
  let run: Promise<void>;
  run = enqueue(() => runBootstrap(userId, gen)).finally(() => {
    if (inflight === run) {
      inflight = null;
      inflightUser = null;
    }
  });
  inflight = run;
  return run;
}

export function refreshRemote(userId?: string): Promise<void> {
  const state = useShapeStore.getState();
  const id = userId ?? state.userId;
  const allowed = canSoftRefresh({
    userId: id,
    ready: state.ready,
    authStatus: state.authStatus,
    localOnly: state.localOnly,
    pendingWrites: pendingWriteCount(),
    bootstrapping: inflight !== null,
  });
  if (!id || !allowed) return refreshCurrent ?? Promise.resolve();
  if (refreshCurrent) {
    refreshAgain = true;
    return refreshCurrent;
  }

  const gen = generation;
  let run: Promise<void>;
  run = (async () => {
    do {
      refreshAgain = false;
      const data = await loadAll(id);
      if (gen !== generation || useShapeStore.getState().userId !== id) return;
      if (pendingWriteCount() > 0) return;
      const current = useShapeStore.getState();
      current.replaceRemote(data);
      if (current.syncError === LOAD_ERROR) useShapeStore.setState({ syncError: null });
    } while (refreshAgain && gen === generation && pendingWriteCount() === 0);
  })()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : "No se pudo actualizar.");
    })
    .finally(() => {
      if (refreshCurrent === run) refreshCurrent = null;
    });
  refreshCurrent = run;
  return run;
}

export function stopLiveSync(): void {
  stopLive?.();
  stopLive = null;
  liveUser = null;
}

export function startLiveSync(userId: string): void {
  if (typeof window === "undefined") return;
  if (liveUser === userId && stopLive) return;
  stopLiveSync();

  const tick = () => {
    if (document.visibilityState !== "visible") return;
    void refreshRemote(userId);
  };
  const onVisible = () => {
    if (document.visibilityState === "visible") tick();
  };
  document.addEventListener("visibilitychange", onVisible);
  const timer = window.setInterval(tick, REFRESH_EVERY_MS);
  let channel: RealtimeChannel | null = null;
  stopLive = () => {
    document.removeEventListener("visibilitychange", onVisible);
    window.clearInterval(timer);
    if (channel) void getSupabase().removeChannel(channel);
  };
  liveUser = userId;
  try {
    channel = subscribeRemote(userId);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "No se pudo suscribir a los cambios.");
  }
}

function subscribeRemote(userId: string): RealtimeChannel | null {
  if (!UUID_RE.test(userId)) return null;
  const supabase = getSupabase();
  const channel = supabase.channel(`shape-sync-${userId}`);
  for (const table of USER_TABLES) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` },
      () => {
        void refreshRemote(userId);
      },
    );
  }
  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
    () => {
      void refreshRemote(userId);
    },
  );
  channel.subscribe();
  return channel;
}

export function retryLegacyImport(): Promise<void> {
  const userId = useShapeStore.getState().userId;
  if (!userId || typeof window === "undefined") return Promise.resolve();
  localStorage.removeItem(legacyImportedFlag(userId));
  useShapeStore.setState({ importingLegacy: true, importNotice: null });
  return bootstrap(userId);
}

async function runBootstrap(userId: string, gen: number) {
  const store = useShapeStore.getState();
  store.beginSession(userId);
  try {
    let data = await loadAll(userId);
    if (gen !== generation) return;
    data = await applyPendingProfile(userId, data);
    if (gen !== generation) return;
    useShapeStore.getState().applyRemote(data, null, false);
    const imported = await importLegacyIfNeeded(userId);
    if (gen !== generation) return;
    if (imported.didImport && pendingWriteCount() === 0) data = await loadAll(userId);
    if (gen !== generation) return;
    if ((imported.didImport || imported.notice || imported.pending) && pendingWriteCount() === 0) {
      useShapeStore.getState().applyRemote(data, imported.notice, imported.pending);
    }
  } catch {
    if (gen !== generation) return;
    useShapeStore.getState().failSession(LOAD_ERROR);
  } finally {
    if (gen === generation && useShapeStore.getState().userId === userId) startLiveSync(userId);
  }
}

async function applyPendingProfile(userId: string, data: Awaited<ReturnType<typeof loadAll>>) {
  const pending = peekPendingProfile();
  if (!pending) return data;
  const name = data.userProfile?.name || pending.name || "";
  const avatar = data.userProfile?.avatar || pending.avatar || null;
  const shouldFillName = Boolean(pending.name) && !data.userProfile?.name;
  const shouldFillAvatar = Boolean(pending.avatar) && !data.userProfile?.avatar;
  if (!shouldFillName && !shouldFillAvatar) {
    clearPendingProfile();
    return data;
  }
  await updateProfile(userId, { name: name || "Perfil", avatar });
  clearPendingProfile();
  return loadAll(userId);
}

async function importLegacyIfNeeded(userId: string): Promise<LegacyImportOutcome> {
  if (typeof window === "undefined") {
    return { didImport: false, pending: false, notice: null };
  }

  let raw: string | null = null;
  try {
    if (localStorage.getItem(legacyImportedFlag(userId)) === "ok") {
      return { didImport: false, pending: false, notice: null };
    }
    raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return { didImport: false, pending: false, notice: null };
  }

  if (!raw) {
    markLegacyImported(userId);
    return { didImport: false, pending: false, notice: null };
  }

  const snapshot = parseLegacySnapshot(raw);
  if (!snapshot) {
    return {
      didImport: false,
      pending: true,
      notice: {
        kind: "error",
        message: "Encontramos datos viejos en este navegador, pero no se pudieron leer.",
      },
    };
  }

  if (!legacyHasData(snapshot)) {
    markLegacyImported(userId);
    return { didImport: false, pending: false, notice: null };
  }

  try {
    useShapeStore.setState({ importingLegacy: true });
    await importSnapshot(userId, snapshot);
    markLegacyImported(userId);
    return {
      didImport: true,
      pending: false,
      notice: { kind: "imported", summary: summarizeLegacy(snapshot) },
    };
  } catch {
    return {
      didImport: false,
      pending: true,
      notice: {
        kind: "error",
        message: "No se pudieron importar los datos guardados en este navegador.",
      },
    };
  }
}

function markLegacyImported(userId: string) {
  try {
    localStorage.setItem(legacyImportedFlag(userId), "ok");
  } catch {
    // Si el navegador bloquea storage, el próximo ingreso vuelve a intentar.
  }
}
