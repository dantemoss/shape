import { handleCategories, jsonError, readIngestEnv } from "@/lib/ingest-expense";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return handleCategories(request, { env: readIngestEnv() });
}

export function POST() {
  return jsonError(405, "Este endpoint solo acepta GET.");
}
