import { handleIngest, jsonError, readIngestEnv } from "@/lib/ingest-expense";
import { insertExpense } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const env = readIngestEnv();
  return handleIngest(request, {
    env,
    insert: (row) =>
      insertExpense(row, {
        supabaseUrl: env.supabaseUrl ?? "",
        serviceRoleKey: env.serviceRoleKey ?? "",
      }),
  });
}

export function GET() {
  return jsonError(405, "Este endpoint solo acepta POST.");
}
