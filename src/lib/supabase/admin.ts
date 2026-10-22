import { createClient } from "@supabase/supabase-js";
import type { ExpenseInsert, InsertOutcome } from "@/lib/ingest-expense";

export async function insertExpense(row: ExpenseInsert, env: { supabaseUrl: string; serviceRoleKey: string }): Promise<InsertOutcome> {
  const supabase = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.from("expenses").insert(row).select("id").single();

  if (error) {
    if (error.code === "23505") return { ok: false, duplicate: true };
    if (error.code === "23503") {
      return { ok: false, status: 400, message: "SHAPE_OWNER_USER_ID no coincide con un usuario de Supabase." };
    }
    if (error.code === "23514") {
      return {
        ok: false,
        status: 400,
        message: "El gasto no cumple las reglas de la tabla. Revisá categoría, moneda u origen.",
      };
    }
    console.error("insert expenses", error.code);
    return { ok: false, message: "No pude guardar el gasto en Supabase." };
  }

  const id = data && typeof data === "object" && "id" in data ? String(data.id) : "";
  if (!id) return { ok: false, message: "Supabase no devolvió el id del gasto." };
  return { ok: true, id };
}
