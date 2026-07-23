import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndProfile } from "@/lib/supabase/profile";
import { LogoutButton } from "@/components/logout-button";
import { UploadForm } from "./upload/upload-form";

export default async function AdminPage() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user) redirect("/login");
  if (profile?.role !== "admin") redirect("/dashboard");

  const supabase = await createClient();

  const [{ data: instructors }, { data: batches }] = await Promise.all([
    supabase.from("instructors").select("id, name, email, active").order("name"),
    supabase
      .from("import_batches")
      .select("id, filename, period, row_count, uploaded_at")
      .order("uploaded_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6 sm:p-10">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Panel de administración
        </h1>
        <LogoutButton />
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Importar Excel mensual
        </h2>
        <UploadForm />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Importaciones recientes
        </h2>
        {!batches?.length ? (
          <p className="text-sm text-neutral-500">Todavía no se importó ningún archivo.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-neutral-500">
              <tr>
                <th className="pb-2 font-medium">Archivo</th>
                <th className="pb-2 font-medium">Período</th>
                <th className="pb-2 font-medium">Filas</th>
                <th className="pb-2 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {batches.map((b) => (
                <tr key={b.id}>
                  <td className="py-2 text-neutral-900 dark:text-neutral-100">{b.filename}</td>
                  <td className="py-2 text-neutral-500">{b.period}</td>
                  <td className="py-2 tabular-nums text-neutral-500">{b.row_count}</td>
                  <td className="py-2 text-neutral-500">
                    {new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short" }).format(
                      new Date(b.uploaded_at),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Instructores
        </h2>
        {!instructors?.length ? (
          <p className="text-sm text-neutral-500">
            Todavía no hay instructores cargados (se crean automáticamente al importar el Excel).
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100 text-sm dark:divide-neutral-800">
            {instructors.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2">
                <span className="text-neutral-900 dark:text-neutral-100">{i.name}</span>
                <span className="text-neutral-500">{i.email ?? "sin vincular a un usuario"}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-neutral-500">
          Para que un instructor pueda loguearse y ver su dashboard: creá su usuario en
          Supabase → Authentication, y después vinculalo corriendo en el SQL Editor{" "}
          <code>update profiles set instructor_id = &apos;&lt;id_instructor&gt;&apos; where id = &apos;&lt;id_usuario&gt;&apos;</code>{" "}
          y <code>update instructors set user_id = &apos;&lt;id_usuario&gt;&apos; where id = &apos;&lt;id_instructor&gt;&apos;</code>.
        </p>
      </section>
    </main>
  );
}
