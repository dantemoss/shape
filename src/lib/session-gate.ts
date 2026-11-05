export type SessionDecision = "bootstrap" | "ignore" | "signout";

export interface SoftRefreshState {
  userId: string | null;
  ready: boolean;
  authStatus: string;
  localOnly: boolean;
  pendingWrites: number;
  bootstrapping: boolean;
}

let rememberedUserId: string | null = null;

export function resetSessionGate(): void {
  rememberedUserId = null;
}

export function rememberedSession(): string | null {
  return rememberedUserId;
}

export function rememberSession(userId: string): void {
  rememberedUserId = userId;
}

export function forgetSession(): void {
  rememberedUserId = null;
}

/**
 * GoTrue re-emits SIGNED_IN every time the tab becomes visible
 * (`_recoverAndRefresh`). That is not a new login. Bootstrapping again
 * sets `ready` back to false and unmounts the app.
 */
export function acceptSession(event: string, userId: string | null): SessionDecision {
  if (!userId) {
    if (event === "INITIAL_SESSION" || event === "SIGNED_OUT") {
      rememberedUserId = null;
      return "signout";
    }
    return "ignore";
  }
  if (event !== "INITIAL_SESSION" && event !== "SIGNED_IN") return "ignore";
  if (rememberedUserId === userId) return "ignore";
  rememberedUserId = userId;
  return "bootstrap";
}

export function canSoftRefresh(state: SoftRefreshState): boolean {
  return Boolean(state.userId)
    && state.ready
    && state.authStatus === "authenticated"
    && !state.localOnly
    && state.pendingWrites === 0
    && !state.bootstrapping;
}
