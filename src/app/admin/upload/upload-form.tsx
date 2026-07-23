"use client";

import { useActionState } from "react";
import { uploadExcel, type UploadResult } from "./actions";

const initialState: UploadResult | null = null;

export function UploadForm() {
  const [state, formAction, isPending] = useActionState(uploadExcel, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Mes del archivo
          <input
            type="month"
            name="period"
            required
            className="mt-1 block rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </label>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Archivo Excel (.xlsx)
          <input
            type="file"
            name="file"
            accept=".xlsx"
            required
            className="mt-1 block text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {isPending ? "Importando..." : "Importar"}
        </button>
      </div>

      {state && (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            state.ok
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          <p>{state.message}</p>
          {state.errors && state.errors.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {state.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-xs text-neutral-500">
        Columnas esperadas en la hoja: <strong>Instructor</strong>,{" "}
        <strong>Categoria</strong>, <strong>Tipo</strong> (ingreso/egreso),{" "}
        <strong>Monto</strong>. Si volvés a subir un archivo para el mismo mes,
        reemplaza los datos de ese mes.
      </p>
    </form>
  );
}
