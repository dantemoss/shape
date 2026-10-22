"use client";

import { bootstrap, retryLegacyImport } from "@/lib/session";
import { useShapeStore } from "@/lib/store";

export function StatusBanners() {
  const syncError = useShapeStore((s) => s.syncError);
  const importNotice = useShapeStore((s) => s.importNotice);
  const importingLegacy = useShapeStore((s) => s.importingLegacy);
  const userId = useShapeStore((s) => s.userId);
  const dismissImportNotice = useShapeStore((s) => s.dismissImportNotice);
  const dismissSyncError = useShapeStore((s) => s.dismissSyncError);

  if (!importingLegacy && !importNotice && !syncError) return null;

  return (
    <div className="px-4 sm:px-8 pt-3 flex flex-col gap-2">
      {importingLegacy && (
        <p className="text-sm text-muted-foreground">Importando los datos de este navegador…</p>
      )}
      {importNotice?.kind === "imported" && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-income/30 bg-income/10 px-3 py-2 text-sm">
          <span>{importNotice.summary}</span>
          <button type="button" onClick={dismissImportNotice} className="text-xs text-muted-foreground hover:text-foreground">
            Cerrar
          </button>
        </div>
      )}
      {importNotice?.kind === "error" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-expense/30 bg-expense/10 px-3 py-2 text-sm">
          <span>{importNotice.message}</span>
          <span className="flex gap-3">
            <button type="button" onClick={() => void retryLegacyImport()} className="text-xs font-medium hover:underline">
              Reintentar
            </button>
            <button type="button" onClick={dismissImportNotice} className="text-xs text-muted-foreground hover:text-foreground">
              Cerrar
            </button>
          </span>
        </div>
      )}
      {syncError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-expense/30 bg-expense/10 px-3 py-2 text-sm">
          <span>{syncError}</span>
          <span className="flex gap-3">
            {userId && (
              <button type="button" onClick={() => void bootstrap(userId)} className="text-xs font-medium hover:underline">
                Reintentar
              </button>
            )}
            <button type="button" onClick={dismissSyncError} className="text-xs text-muted-foreground hover:text-foreground">
              Cerrar
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
