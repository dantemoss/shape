import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  acceptSession,
  canSoftRefresh,
  rememberedSession,
  resetSessionGate,
} from "./session-gate";

const ready = {
  userId: "user-1",
  ready: true,
  authStatus: "authenticated",
  localOnly: false,
  pendingWrites: 0,
  bootstrapping: false,
};

describe("acceptSession", () => {
  it("arranque con sesión nueva", () => {
    resetSessionGate();
    assert.equal(acceptSession("INITIAL_SESSION", "user-1"), "bootstrap");
    assert.equal(rememberedSession(), "user-1");
  });

  it("SIGNED_IN de la misma cuenta al volver a la pestaña no reinicia", () => {
    resetSessionGate();
    acceptSession("INITIAL_SESSION", "user-1");
    assert.equal(acceptSession("SIGNED_IN", "user-1"), "ignore");
    assert.equal(acceptSession("TOKEN_REFRESHED", "user-1"), "ignore");
  });

  it("otra cuenta sí reinicia", () => {
    resetSessionGate();
    acceptSession("SIGNED_IN", "user-1");
    assert.equal(acceptSession("SIGNED_IN", "user-2"), "bootstrap");
  });

  it("cerrar sesión olvida la cuenta", () => {
    resetSessionGate();
    acceptSession("SIGNED_IN", "user-1");
    assert.equal(acceptSession("SIGNED_OUT", null), "signout");
    assert.equal(rememberedSession(), null);
    assert.equal(acceptSession("SIGNED_IN", "user-1"), "bootstrap");
  });

  it("sin sesión al inicio manda a login", () => {
    resetSessionGate();
    assert.equal(acceptSession("INITIAL_SESSION", null), "signout");
  });
});

describe("canSoftRefresh", () => {
  it("permite releer con la app ya abierta", () => {
    assert.equal(canSoftRefresh(ready), true);
  });

  it("no pisa un guardado en curso ni el primer arranque", () => {
    assert.equal(canSoftRefresh({ ...ready, pendingWrites: 1 }), false);
    assert.equal(canSoftRefresh({ ...ready, bootstrapping: true }), false);
    assert.equal(canSoftRefresh({ ...ready, ready: false }), false);
    assert.equal(canSoftRefresh({ ...ready, localOnly: true }), false);
  });
});
