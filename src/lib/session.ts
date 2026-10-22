"use client";

import { clearPendingProfile, peekPendingProfile } from "./auth";
import { importSnapshot, loadAll, updateProfile } from "./db";
import {
  LEGACY_STORAGE_KEY,
  legacyHasData,
  legacyImportedFlag,
  parseLegacySnapshot,
  summarizeLegacy,
} from "./legacy-snapshot";
import { useShapeStore, type ImportNotice } from "./store";

let chain: Promise<void> = Promise.resolve();
let generation = 0;

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
  useShapeStore.getState().resetSession();
}

export function bootstrap(userId: string): Promise<void> {
  const gen = generation;
  return enqueue(() => runBootstrap(userId, gen));
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
    const imported = await importLegacyIfNeeded(userId);
    if (gen !== generation) return;
    if (imported.didImport) data = await loadAll(userId);
    if (gen !== generation) return;
    useShapeStore.getState().applyRemote(data, imported.notice, imported.pending);
  } catch {
    if (gen !== generation) return;
    useShapeStore.getState().failSession("No se pudieron cargar tus datos.");
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
