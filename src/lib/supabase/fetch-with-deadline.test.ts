import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fetchWithDeadline } from "./fetch-with-deadline";

function hung(init: RequestInit | undefined): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const fail = () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    if (init?.signal?.aborted) {
      fail();
      return;
    }
    init?.signal?.addEventListener("abort", fail, { once: true });
  });
}

describe("fetchWithDeadline", () => {
  it("reintenta un GET que no responde", async () => {
    let calls = 0;
    const response = await fetchWithDeadline(
      "https://example.test/rows",
      { method: "GET" },
      (_input, init) => {
        calls += 1;
        if (calls === 1) return hung(init);
        return Promise.resolve(new Response("ok", { status: 200 }));
      },
      20,
    );
    assert.equal(response.status, 200);
    assert.equal(calls, 2);
  });

  it("reintenta un GET 503 una vez", async () => {
    let calls = 0;
    const response = await fetchWithDeadline(
      "https://example.test/rows",
      undefined,
      async () => {
        calls += 1;
        if (calls === 1) return new Response("no", { status: 503 });
        return new Response("ok", { status: 200 });
      },
      1_000,
    );
    assert.equal(response.status, 200);
    assert.equal(calls, 2);
  });

  it("no reintenta un POST", async () => {
    let calls = 0;
    await assert.rejects(() =>
      fetchWithDeadline(
        "https://example.test/rows",
        { method: "POST" },
        (_input, init) => {
          calls += 1;
          return hung(init);
        },
        20,
      ),
    );
    assert.equal(calls, 1);
  });

  it("no reintenta un 401", async () => {
    let calls = 0;
    const response = await fetchWithDeadline(
      "https://example.test/rows",
      { method: "GET" },
      async () => {
        calls += 1;
        return new Response("no", { status: 401 });
      },
      1_000,
    );
    assert.equal(response.status, 401);
    assert.equal(calls, 1);
  });

  it("respeta un abort del llamador", async () => {
    const controller = new AbortController();
    controller.abort();
    let calls = 0;
    await assert.rejects(() =>
      fetchWithDeadline(
        "https://example.test/rows",
        { signal: controller.signal },
        async () => {
          calls += 1;
          return new Response("ok");
        },
        1_000,
      ),
    );
    assert.equal(calls, 0);
  });
});
