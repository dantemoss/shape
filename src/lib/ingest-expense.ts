import { createHash, timingSafeEqual } from "node:crypto";

export const EXPENSE_SOURCES = ["manual", "mercadopago", "shortcut"] as const;
export type ExpenseSource = (typeof EXPENSE_SOURCES)[number];

/**
 * Secciones de gasto que Shape ya usa al cargar un movimiento.
 * Transporte va primero: es la única de Delivery, Transporte y Servicios
 * que existe como categoría. Delivery y Servicios no se agregan acá.
 */
export const SHAPE_EXPENSE_CATEGORIES = [
  { id: "transport", label: "Transporte" },
  { id: "food", label: "Comida" },
  { id: "subscriptions", label: "Suscripciones" },
  { id: "entertainment", label: "Ocio" },
  { id: "housing", label: "Vivienda" },
  { id: "health", label: "Salud" },
  { id: "clothing", label: "Ropa" },
  { id: "education", label: "Educación" },
  { id: "savings", label: "Ahorro" },
  { id: "other", label: "Otro" },
] as const;

export type ExpenseCategoryId = (typeof SHAPE_EXPENSE_CATEGORIES)[number]["id"];

const CATEGORY_ALIASES: Record<string, ExpenseCategoryId> = {
  housing: "housing",
  vivienda: "housing",
  food: "food",
  comida: "food",
  transport: "transport",
  transporte: "transport",
  entertainment: "entertainment",
  entretenimiento: "entertainment",
  ocio: "entertainment",
  health: "health",
  salud: "health",
  education: "education",
  educacion: "education",
  subscriptions: "subscriptions",
  suscripciones: "subscriptions",
  suscripcion: "subscriptions",
  clothing: "clothing",
  ropa: "clothing",
  savings: "savings",
  ahorro: "savings",
  other: "other",
  otro: "other",
};

const NOT_A_SECTION: Record<string, string> = {
  delivery: "Delivery no es una categoría de Shape. Cargalo como Comida.",
  servicios: "Servicios no es una categoría de Shape. Cargalo como Vivienda.",
  servicio: "Servicios no es una categoría de Shape. Cargalo como Vivienda.",
};

const SOURCE_ALIASES: Record<string, ExpenseSource> = {
  manual: "manual",
  mercadopago: "mercadopago",
  mercado_pago: "mercadopago",
  "mercado-pago": "mercadopago",
  "mercado pago": "mercadopago",
  mp: "mercadopago",
  shortcut: "shortcut",
  atajo: "shortcut",
};

export interface ExpenseInsert {
  user_id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  merchant: string | null;
  category: ExpenseCategoryId;
  source: ExpenseSource;
  external_id: string | null;
}

export interface IngestEnv {
  token: string | null;
  userId: string | null;
  supabaseUrl: string | null;
  serviceRoleKey: string | null;
}

export type InsertOutcome =
  | { ok: true; id: string }
  | { ok: false; duplicate: true }
  | { ok: false; duplicate?: false; status?: number; message: string };

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function jsonError(status: number, error: string, extra?: Record<string, unknown>): Response {
  return Response.json(
    { error, ...extra },
    { status, headers: { "cache-control": "no-store" } }
  );
}

export function readIngestEnv(env: NodeJS.ProcessEnv = process.env): IngestEnv {
  return {
    token: blankToNull(env.SHAPE_INGEST_TOKEN),
    userId: blankToNull(env.SHAPE_OWNER_USER_ID),
    supabaseUrl: blankToNull(env.NEXT_PUBLIC_SUPABASE_URL),
    serviceRoleKey: blankToNull(env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

export async function handleIngest(
  request: Request,
  options: {
    env: IngestEnv;
    now?: Date;
    insert: (row: ExpenseInsert) => Promise<InsertOutcome>;
  }
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonError(405, "Este endpoint solo acepta POST.");
  }

  const missing = missingConfig(options.env);
  if (missing.includes("SHAPE_INGEST_TOKEN")) {
    return jsonError(500, `Falta configurar ${missing.join(", ")} en el servidor.`);
  }

  const provided = readBearer(request);
  if (!provided) {
    return jsonError(401, "Falta el encabezado Authorization: Bearer <token>.");
  }
  if (!tokensMatch(provided, options.env.token ?? "")) {
    return jsonError(401, "Token inválido.");
  }

  if (missing.length > 0) {
    return jsonError(500, `Falta configurar ${missing.join(", ")} en el servidor.`);
  }
  if (!UUID.test(options.env.userId ?? "")) {
    return jsonError(500, "SHAPE_OWNER_USER_ID no es un UUID válido.");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError(400, "El cuerpo no es un JSON válido.");
  }

  const built = buildExpenseInsert(payload, options.env.userId ?? "", options.now ?? new Date());
  if (!built.ok) return jsonError(built.status, built.error);

  try {
    const result = await options.insert(built.row);
    if (!result.ok && result.duplicate) {
      return jsonError(409, "Ya existe un gasto con ese external_id.", {
        external_id: built.row.external_id,
      });
    }
    if (!result.ok) return jsonError(result.status ?? 502, result.message);
    return Response.json(
      {
        id: result.id,
        amount: built.row.amount,
        currency: built.row.currency,
        date: built.row.date,
        description: built.row.description,
        merchant: built.row.merchant,
        category: built.row.category,
        source: built.row.source,
        external_id: built.row.external_id,
      },
      { status: 201, headers: { "cache-control": "no-store" } }
    );
  } catch {
    return jsonError(502, "No pude guardar el gasto en Supabase.");
  }
}

export function buildExpenseInsert(
  payload: unknown,
  userId: string,
  now: Date
): { ok: true; row: ExpenseInsert } | { ok: false; status: number; error: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, status: 400, error: "El cuerpo tiene que ser un objeto JSON." };
  }

  const body = lowerKeys(payload as Record<string, unknown>);
  const amount = parseAmount(first(body, ["amount", "monto"]));
  if (amount === null) {
    return {
      ok: false,
      status: 400,
      error: "No pude leer el monto. Mandá un número o un texto como 12.345,67.",
    };
  }

  const descriptionRaw = readText(first(body, ["description", "descripcion"]));
  const merchantRaw = readText(first(body, ["merchant", "comercio"]));
  const label = descriptionRaw || merchantRaw;
  if (!label) {
    return { ok: false, status: 400, error: "Falta el comercio o la descripción." };
  }

  const category = parseCategory(first(body, ["category", "categoria"]));
  if (!category.ok) return { ok: false, status: 400, error: category.error };

  const source = parseSource(first(body, ["source", "origen"]));
  if (!source.ok) return { ok: false, status: 400, error: source.error };

  const currency = parseCurrency(first(body, ["currency", "moneda"]));
  if (!currency.ok) return { ok: false, status: 400, error: currency.error };

  const date = parseExpenseDate(first(body, ["date", "fecha"]), now);
  if (!date.ok) return { ok: false, status: 400, error: date.error };

  const externalId = parseExternalId(first(body, ["external_id", "externalid"]));
  if (!externalId.ok) return { ok: false, status: 400, error: externalId.error };

  return {
    ok: true,
    row: {
      user_id: userId,
      amount,
      currency: currency.value,
      date: date.date,
      description: label,
      merchant: merchantRaw || descriptionRaw,
      category: category.value,
      source: source.value,
      external_id: externalId.value,
    },
  };
}

export function parseAmount(value: unknown): number | null {
  if (typeof value === "number") return positiveMoney(value);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if ("amount" in record) return parseAmount(record.amount);
    if ("value" in record) return parseAmount(record.value);
    return null;
  }
  if (typeof value !== "string") return null;

  let text = value.trim().toLowerCase();
  if (!text) return null;
  text = text.replace(/ars|usd|eur|\$|€/g, "").replace(/\s+/g, "");
  if (!/^[-+]?[\d.,]+$/.test(text)) return null;

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  let normalized = text;

  if (lastComma !== -1 && lastDot !== -1) {
    normalized = lastComma > lastDot ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  } else if (lastComma !== -1) {
    const groups = text.split(",");
    const tail = groups[groups.length - 1] ?? "";
    normalized = groups.length > 1 && tail.length === 3 ? text.replace(/,/g, "") : text.replace(",", ".");
  } else if (lastDot !== -1) {
    const groups = text.split(".");
    const tail = groups[groups.length - 1] ?? "";
    normalized = groups.length > 1 && tail.length === 3 ? text.replace(/\./g, "") : text;
  }

  return positiveMoney(Number(normalized));
}

function positiveMoney(value: number): number | null {
  if (!Number.isFinite(value) || value <= 0 || value > 999_999_999_999.99) return null;
  return Math.round(value * 100) / 100;
}

export function parseExpenseDate(
  value: unknown,
  now: Date
): { ok: true; date: string } | { ok: false; error: string } {
  if (value == null || value === "") return { ok: true, date: formatArgentinaDate(now) };
  if (typeof value !== "string") {
    return { ok: false, error: "No pude leer la fecha. Usá AAAA-MM-DD o DD/MM/AAAA." };
  }

  const trimmed = value.trim();
  const isoDay = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoDay) return calendarDate(Number(isoDay[1]), Number(isoDay[2]), Number(isoDay[3]));

  const localDay = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(trimmed);
  if (localDay) return calendarDate(Number(localDay[3]), Number(localDay[2]), Number(localDay[1]));

  const instant = new Date(trimmed);
  if (Number.isNaN(instant.getTime())) {
    return { ok: false, error: "No pude leer la fecha. Usá AAAA-MM-DD o DD/MM/AAAA." };
  }
  return { ok: true, date: formatArgentinaDate(instant) };
}

function calendarDate(
  year: number,
  month: number,
  day: number
): { ok: true; date: string } | { ok: false; error: string } {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return { ok: false, error: "La fecha no existe." };
  }
  const monthText = String(month).padStart(2, "0");
  const dayText = String(day).padStart(2, "0");
  return { ok: true, date: `${year}-${monthText}-${dayText}` };
}

export function formatArgentinaDate(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

function categoryList(): string {
  return SHAPE_EXPENSE_CATEGORIES.map((category) => category.label).join(", ");
}

function parseCategory(
  value: unknown
): { ok: true; value: ExpenseCategoryId } | { ok: false; error: string } {
  if (value == null || value === "") return { ok: true, value: "other" };
  if (typeof value !== "string") {
    return { ok: false, error: `La categoría tiene que ser una de: ${categoryList()}.` };
  }
  const folded = fold(value);
  const missing = NOT_A_SECTION[folded];
  if (missing) return { ok: false, error: missing };
  const match = CATEGORY_ALIASES[folded];
  if (!match) {
    return { ok: false, error: `Categoría desconocida. Usá una de: ${categoryList()}.` };
  }
  return { ok: true, value: match };
}

export function handleCategories(request: Request, options: { env: IngestEnv }): Response {
  if (request.method !== "GET") {
    return jsonError(405, "Este endpoint solo acepta GET.");
  }
  if (!options.env.token) {
    return jsonError(500, "Falta configurar SHAPE_INGEST_TOKEN en el servidor.");
  }

  const provided = readBearer(request);
  if (!provided) {
    return jsonError(401, "Falta el encabezado Authorization: Bearer <token>.");
  }
  if (!tokensMatch(provided, options.env.token)) {
    return jsonError(401, "Token inválido.");
  }

  const categories = SHAPE_EXPENSE_CATEGORIES.map(({ id, label }) => ({ id, label }));
  return Response.json(
    { categories, labels: categories.map((category) => category.label) },
    { status: 200, headers: { "cache-control": "no-store" } }
  );
}

function parseSource(value: unknown): { ok: true; value: ExpenseSource } | { ok: false; error: string } {
  if (value == null || value === "") return { ok: true, value: "shortcut" };
  if (typeof value !== "string") {
    return { ok: false, error: `El origen tiene que ser uno de: ${EXPENSE_SOURCES.join(", ")}.` };
  }
  const match = SOURCE_ALIASES[fold(value)];
  if (!match) {
    return { ok: false, error: `Origen desconocido. Usá uno de: ${EXPENSE_SOURCES.join(", ")}.` };
  }
  return { ok: true, value: match };
}

function parseCurrency(value: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (value == null || value === "") return { ok: true, value: "ARS" };
  if (typeof value !== "string" || !/^[a-zA-Z]{3}$/.test(value.trim())) {
    return { ok: false, error: "La moneda tiene que ser un código de 3 letras, como ARS." };
  }
  return { ok: true, value: value.trim().toUpperCase() };
}

function parseExternalId(value: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value == null || value === "") return { ok: true, value: null };
  if (typeof value !== "string" && typeof value !== "number") {
    return { ok: false, error: "external_id tiene que ser un texto." };
  }
  const text = String(value).trim();
  if (!text) return { ok: true, value: null };
  if (text.length > 200) return { ok: false, error: "external_id es demasiado largo." };
  return { ok: true, value: text };
}

function missingConfig(env: IngestEnv): string[] {
  const missing: string[] = [];
  if (!env.token) missing.push("SHAPE_INGEST_TOKEN");
  if (!env.userId) missing.push("SHAPE_OWNER_USER_ID");
  if (!env.supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!env.serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
}

function readBearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header.trim());
  return match?.[1] ?? null;
}

function tokensMatch(provided: string, expected: string): boolean {
  const left = createHash("sha256").update(provided).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

function lowerKeys(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) out[fold(key)] = value;
  return out;
}

function first(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] != null && record[key] !== "") return record[key];
  }
  return undefined;
}

function readText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
