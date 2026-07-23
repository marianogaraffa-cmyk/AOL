"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndProfile } from "@/lib/supabase/profile";
import { parseTransactionsWorkbook } from "@/lib/excel/parse-transactions";

export type UploadResult = {
  ok: boolean;
  message: string;
  errors?: string[];
};

const PERIOD_RE = /^\d{4}-\d{2}$/;

export async function uploadExcel(
  _prev: UploadResult | null,
  formData: FormData,
): Promise<UploadResult> {
  const { profile } = await getCurrentUserAndProfile();
  if (profile?.role !== "admin") {
    return { ok: false, message: "No tenés permisos de administrador." };
  }

  const file = formData.get("file");
  const periodInput = String(formData.get("period") ?? "");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Subí un archivo .xlsx." };
  }
  if (!PERIOD_RE.test(periodInput)) {
    return { ok: false, message: "Elegí el mes que corresponde al archivo." };
  }

  const period = `${periodInput}-01`;
  const buffer = await file.arrayBuffer();
  const { rows, errors: parseErrors } = await parseTransactionsWorkbook(buffer);

  if (rows.length === 0) {
    return {
      ok: false,
      message: "No se encontraron filas válidas para importar.",
      errors: parseErrors,
    };
  }

  const supabase = await createClient();

  // Resolver instructores (crear los que falten).
  const instructorNames = [...new Set(rows.map((r) => r.instructor))];
  const { data: existingInstructors } = await supabase
    .from("instructors")
    .select("id, name")
    .in("name", instructorNames);

  const instructorIdByName = new Map(
    (existingInstructors ?? []).map((i) => [i.name, i.id as string]),
  );
  const missingInstructors = instructorNames.filter((n) => !instructorIdByName.has(n));

  if (missingInstructors.length > 0) {
    const { data: created, error } = await supabase
      .from("instructors")
      .insert(missingInstructors.map((name) => ({ name })))
      .select("id, name");
    if (error) {
      return { ok: false, message: `Error creando instructores: ${error.message}` };
    }
    for (const i of created ?? []) instructorIdByName.set(i.name, i.id);
  }

  // Resolver categorías (crear las que falten).
  const categoryKeys = [...new Set(rows.map((r) => `${r.category}__${r.type}`))];
  const { data: existingCategories } = await supabase
    .from("categories")
    .select("id, name, type");

  const categoryIdByKey = new Map(
    (existingCategories ?? []).map((c) => [`${c.name}__${c.type}`, c.id as string]),
  );
  const missingCategoryKeys = categoryKeys.filter((k) => !categoryIdByKey.has(k));

  if (missingCategoryKeys.length > 0) {
    const toCreate = missingCategoryKeys.map((k) => {
      const [name, type] = k.split("__");
      return { name, type };
    });
    const { data: created, error } = await supabase
      .from("categories")
      .insert(toCreate)
      .select("id, name, type");
    if (error) {
      return { ok: false, message: `Error creando categorías: ${error.message}` };
    }
    for (const c of created ?? []) categoryIdByKey.set(`${c.name}__${c.type}`, c.id);
  }

  // Reemplazar los datos del período si ya existían (re-subida del mismo mes).
  const { error: deleteError } = await supabase
    .from("transactions")
    .delete()
    .eq("period", period);
  if (deleteError) {
    return { ok: false, message: `Error limpiando datos previos: ${deleteError.message}` };
  }

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({ filename: file.name, period, row_count: rows.length })
    .select("id")
    .single();
  if (batchError || !batch) {
    return { ok: false, message: `Error registrando la importación: ${batchError?.message}` };
  }

  const toInsert = rows.map((r) => ({
    instructor_id: instructorIdByName.get(r.instructor)!,
    category_id: categoryIdByKey.get(`${r.category}__${r.type}`)!,
    period,
    type: r.type,
    amount: r.amount,
    batch_id: batch.id,
  }));

  const { error: insertError } = await supabase.from("transactions").insert(toInsert);
  if (insertError) {
    return { ok: false, message: `Error insertando transacciones: ${insertError.message}` };
  }

  revalidatePath("/admin");

  return {
    ok: true,
    message: `Se importaron ${toInsert.length} filas para ${periodInput}.` +
      (missingInstructors.length ? ` Instructores nuevos: ${missingInstructors.join(", ")}.` : ""),
    errors: parseErrors.length ? parseErrors : undefined,
  };
}
