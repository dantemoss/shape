import { CC0_MARKS, type Cc0Mark } from "@/components/marks/cc0-marks";

/** Nombre plegado → slug de simple-icons. Vacío: monograma a propósito. */
const ALIAS: Record<string, string> = {
  netflix: "netflix",
  spotify: "spotify",
  youtube: "youtube",
  "youtube premium": "youtube",
  "youtube music": "youtube",
  amazon: "amazon",
  "amazon prime": "amazon",
  apple: "apple",
  "apple tv": "appletv",
  icloud: "icloud",
  notion: "notion",
  github: "github",
  "github copilot": "github",
  openai: "openai",
  "chatgpt plus": "openai",
  chatgpt: "openai",
  xbox: "xbox",
  "xbox game pass": "xbox",
  playstation: "playstation",
  "playstation plus": "playstation",
  google: "google",
  "google one": "google",
  "google gemini": "googlegemini",
  gemini: "googlegemini",
  max: "max",
  "hbo max": "max",
  hbo: "hbo",
  disney: "",
  "disney plus": "",
  "pedidosya plus": "",
  "pedidos ya plus": "",
  "rappi prime": "",
  cursor: "",
  "cursor ai": "",
};

const HOST_SLUG: Record<string, string> = {
  "netflix.com": "netflix",
  "spotify.com": "spotify",
  "youtube.com": "youtube",
  "max.com": "max",
  "amazon.com": "amazon",
  "apple.com": "apple",
  "notion.so": "notion",
  "github.com": "github",
  "openai.com": "openai",
  "google.com": "google",
  "one.google.com": "google",
  "xbox.com": "xbox",
  "playstation.com": "playstation",
  "disneyplus.com": "",
  "pedidosya.com": "",
  "rappi.com": "",
  "cursor.com": "",
};

const DOMAIN_BY_KEY: Record<string, string> = {
  netflix: "netflix.com",
  spotify: "spotify.com",
  youtube: "youtube.com",
  "youtube premium": "youtube.com",
  disney: "disneyplus.com",
  "disney plus": "disneyplus.com",
  "hbo max": "max.com",
  max: "max.com",
  "amazon prime": "amazon.com",
  "apple tv": "apple.com",
  icloud: "apple.com",
  "google one": "one.google.com",
  "google gemini": "google.com",
  "chatgpt plus": "openai.com",
  notion: "notion.so",
  "github copilot": "github.com",
  "xbox game pass": "xbox.com",
  "playstation plus": "playstation.com",
  "pedidosya plus": "pedidosya.com",
  "rappi prime": "rappi.com",
  "cursor ai": "cursor.com",
  cursor: "cursor.com",
};

export function foldServiceName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function markFromSlug(slug: string): Cc0Mark | null {
  if (!slug) return null;
  return CC0_MARKS[slug] ?? null;
}

export function resolveServiceMark(name: string, domain = ""): Cc0Mark | null {
  const key = foldServiceName(name);
  if (key in ALIAS) return markFromSlug(ALIAS[key]);
  const host = domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
  if (host in HOST_SLUG) return markFromSlug(HOST_SLUG[host]);
  return null;
}

export function domainForName(name: string): string {
  return DOMAIN_BY_KEY[foldServiceName(name)] ?? "";
}

export function monogram(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  if (trimmed.includes("+")) {
    const letter = trimmed.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ]/);
    return `${(letter?.[0] ?? trimmed[0]).toLocaleUpperCase("es-AR")}+`;
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toLocaleUpperCase("es-AR");
  return trimmed.slice(0, 2).toLocaleUpperCase("es-AR");
}
