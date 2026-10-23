import assert from "node:assert/strict";
import test from "node:test";
import {
  SHAPE_EXPENSE_CATEGORIES,
  buildExpenseInsert,
  formatArgentinaDate,
  handleCategories,
  handleIngest,
  parseAmount,
  type ExpenseInsert,
  type IngestEnv,
} from "./ingest-expense";

const userId = "11111111-1111-4111-8111-111111111111";

const env: IngestEnv = {
  token: "secreto",
  userId,
  supabaseUrl: "https://example.supabase.co",
  serviceRoleKey: "service-role",
};

const now = new Date("2026-10-22T15:00:00.000Z");

test("lee montos en formato argentino y de Wallet", () => {
  assert.equal(parseAmount("$ 12.345,67"), 12345.67);
  assert.equal(parseAmount("12.345,67"), 12345.67);
  assert.equal(parseAmount("1.234.567,89"), 1234567.89);
  assert.equal(parseAmount("12,50"), 12.5);
  assert.equal(parseAmount("12.345"), 12345);
  assert.equal(parseAmount("12.50"), 12.5);
  assert.equal(parseAmount("ARS 1.500,00"), 1500);
  assert.equal(parseAmount(1500), 1500);
  assert.equal(parseAmount({ amount: "99,5" }), 99.5);
  assert.equal(parseAmount("0"), null);
  assert.equal(parseAmount("-12,00"), null);
  assert.equal(parseAmount("no es un monto"), null);
});

test("arma el gasto con defaults de atajo", () => {
  const built = buildExpenseInsert({ merchant: "YPF", amount: "$ 2.000,50" }, userId, now);
  assert.equal(built.ok, true);
  if (!built.ok) return;
  assert.equal(built.row.amount, 2000.5);
  assert.equal(built.row.currency, "ARS");
  assert.equal(built.row.source, "shortcut");
  assert.equal(built.row.category, "other");
  assert.equal(built.row.description, "YPF");
  assert.equal(built.row.merchant, "YPF");
  assert.equal(built.row.date, "2026-10-22");
  assert.equal(built.row.external_id, null);
});

test("acepta aliases en español y una fecha local", () => {
  const built = buildExpenseInsert(
    {
      monto: "10,00",
      comercio: "Farmacity",
      categoria: "Salud",
      fecha: "21/10/2026",
      moneda: "ars",
      origen: "Mercado Pago",
      external_id: "mp-1",
    },
    userId,
    now
  );
  assert.equal(built.ok, true);
  if (!built.ok) return;
  assert.deepEqual(
    {
      category: built.row.category,
      date: built.row.date,
      currency: built.row.currency,
      source: built.row.source,
      external_id: built.row.external_id,
    },
    {
      category: "health",
      date: "2026-10-21",
      currency: "ARS",
      source: "mercadopago",
      external_id: "mp-1",
    }
  );
});

test("la medianoche UTC cae en el día anterior de Argentina", () => {
  assert.equal(formatArgentinaDate(new Date("2026-10-22T02:30:00.000Z")), "2026-10-21");
});

test("acepta las secciones de Shape y rechaza Delivery y Servicios", () => {
  for (const category of SHAPE_EXPENSE_CATEGORIES) {
    const byLabel = buildExpenseInsert(
      { amount: 10, merchant: "X", category: category.label },
      userId,
      now
    );
    assert.equal(byLabel.ok, true);
    if (byLabel.ok) assert.equal(byLabel.row.category, category.id);
  }

  const ocio = buildExpenseInsert({ amount: 10, merchant: "X", category: "Entretenimiento" }, userId, now);
  assert.equal(ocio.ok, true);
  if (ocio.ok) assert.equal(ocio.row.category, "entertainment");

  const delivery = buildExpenseInsert({ amount: 10, merchant: "Rappi", category: "Delivery" }, userId, now);
  assert.equal(delivery.ok, false);
  if (!delivery.ok) assert.match(delivery.error, /Comida/);

  const servicios = buildExpenseInsert({ amount: 10, merchant: "Edenor", category: "Servicios" }, userId, now);
  assert.equal(servicios.ok, false);
  if (!servicios.ok) assert.match(servicios.error, /Vivienda/);

  const unknown = buildExpenseInsert({ amount: 10, merchant: "X", category: "viaje" }, userId, now);
  assert.equal(unknown.ok, false);
  if (!unknown.ok) assert.match(unknown.error, /Transporte/);
});

test("rechaza fecha y cuerpo sin comercio", () => {
  assert.equal(buildExpenseInsert({ amount: 10, merchant: "X", date: "32/01/2026" }, userId, now).ok, false);
  const missing = buildExpenseInsert({ amount: 10 }, userId, now);
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.match(missing.error, /comercio/);
});

test("GET /api/categorias devuelve las secciones reales con el mismo token", async () => {
  const ok = await handleCategories(get("/api/categorias"), { env });
  assert.equal(ok.status, 200);
  const body = (await ok.json()) as { labels: string[]; categories: { id: string; label: string }[] };
  assert.deepEqual(
    body.labels,
    SHAPE_EXPENSE_CATEGORIES.map((category) => category.label)
  );
  assert.equal(body.labels[0], "Transporte");
  const labels: string[] = body.labels;
  assert.equal(labels.includes("Delivery"), false);
  assert.equal(labels.includes("Servicios"), false);
  assert.equal(body.categories[0]?.id, "transport");

  const missing = await handleCategories(get("/api/categorias", ""), { env });
  assert.equal(missing.status, 401);

  const wrong = await handleCategories(get("/api/categorias", "otro"), { env });
  assert.equal(wrong.status, 401);

  const unconfigured = await handleCategories(get("/api/categorias"), { env: { ...env, token: null } });
  assert.equal(unconfigured.status, 500);
});

test("el endpoint exige el token y devuelve JSON", async () => {
  const inserted: ExpenseInsert[] = [];
  const created = await handleIngest(post({ amount: "12,00", description: "Kiosco" }), {
    env,
    now,
    insert: async (row) => {
      inserted.push(row);
      return { ok: true, id: "abc" };
    },
  });
  assert.equal(created.status, 201);
  assert.equal(inserted[0]?.user_id, userId);
  assert.equal(((await created.json()) as { id: string }).id, "abc");

  const missing = await handleIngest(post({ amount: 1, merchant: "X" }, ""), {
    env,
    now,
    insert: async () => ({ ok: true, id: "no" }),
  });
  assert.equal(missing.status, 401);
  assert.equal(((await missing.json()) as { error: string }).error.includes("Authorization"), true);

  const wrong = await handleIngest(post({ amount: 1, merchant: "X" }, "otro"), {
    env,
    now,
    insert: async () => ({ ok: true, id: "no" }),
  });
  assert.equal(wrong.status, 401);

  const duplicate = await handleIngest(post({ amount: 1, merchant: "X", external_id: "dup" }), {
    env,
    now,
    insert: async () => ({ ok: false, duplicate: true }),
  });
  assert.equal(duplicate.status, 409);

  const unconfigured = await handleIngest(post({ amount: 1, merchant: "X" }), {
    env: { ...env, token: null },
    now,
    insert: async () => ({ ok: true, id: "no" }),
  });
  assert.equal(unconfigured.status, 500);
  const unconfiguredBody = (await unconfigured.json()) as { error: string };
  assert.match(unconfiguredBody.error, /SHAPE_INGEST_TOKEN/);
});

function get(path: string, token = "secreto"): Request {
  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${token}`);
  return new Request(`https://shape-coral.vercel.app${path}`, { method: "GET", headers });
}

function post(body: unknown, token = "secreto"): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (token) headers.set("authorization", `Bearer ${token}`);
  return new Request("https://shape-coral.vercel.app/api/gastos", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}
