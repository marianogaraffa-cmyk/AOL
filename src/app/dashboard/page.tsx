import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndProfile } from "@/lib/supabase/profile";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { MonthlyTrendChart, type MonthlyPoint } from "@/components/dashboard/monthly-trend-chart";
import { CategoryBarChart, type CategoryPoint } from "@/components/dashboard/category-bar-chart";
import { LogoutButton } from "@/components/logout-button";

type TransactionRow = {
  period: string;
  type: "ingreso" | "egreso";
  amount: number;
  categories: { name: string } | { name: string }[] | null;
};

function categoryName(categories: TransactionRow["categories"]) {
  if (!categories) return "Sin categoría";
  return Array.isArray(categories) ? categories[0]?.name ?? "Sin categoría" : categories.name;
}

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: instructor } = profile?.instructor_id
    ? await supabase
        .from("instructors")
        .select("name")
        .eq("id", profile.instructor_id)
        .single()
    : { data: null };

  if (!instructor) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-lg font-semibold">Tu cuenta todavía no está vinculada</h1>
          <p className="text-sm text-neutral-500">
            Contactá al administrador para que asocie tu usuario a tu perfil de instructor.
          </p>
          <LogoutButton />
        </div>
      </main>
    );
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select("period, type, amount, categories(name)")
    .order("period", { ascending: true })
    .returns<TransactionRow[]>();

  const rows = transactions ?? [];

  const monthlyMap = new Map<string, MonthlyPoint>();
  for (const row of rows) {
    const point = monthlyMap.get(row.period) ?? { period: row.period, ingreso: 0, egreso: 0 };
    point[row.type] += Number(row.amount);
    monthlyMap.set(row.period, point);
  }
  const monthly = [...monthlyMap.values()].sort((a, b) => a.period.localeCompare(b.period));

  const latestPeriod = monthly.at(-1)?.period;
  const latest = monthly.at(-1) ?? { ingreso: 0, egreso: 0 };
  const resultado = latest.ingreso - latest.egreso;

  const categoryTotals = (type: "ingreso" | "egreso"): CategoryPoint[] => {
    const map = new Map<string, number>();
    for (const row of rows) {
      if (row.period !== latestPeriod || row.type !== type) continue;
      const name = categoryName(row.categories);
      map.set(name, (map.get(name) ?? 0) + Number(row.amount));
    }
    return [...map.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6 sm:p-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            {instructor.name}
          </h1>
          <p className="text-sm text-neutral-500">
            {latestPeriod ? `Último período con datos: ${latestPeriod}` : "Todavía no hay datos cargados"}
          </p>
        </div>
        <LogoutButton />
      </header>

      {!latestPeriod ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
          Cuando el admin suba el Excel del mes vas a ver acá tu performance.
        </p>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiTile label="Ingresos del mes" amount={latest.ingreso} />
            <KpiTile label="Egresos del mes" amount={latest.egreso} />
            <KpiTile label="Resultado del mes" amount={resultado} variant="result" />
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Evolución mensual
            </h2>
            <MonthlyTrendChart data={monthly} />
          </section>

          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Ingresos por categoría (mes actual)
              </h2>
              <CategoryBarChart data={categoryTotals("ingreso")} hue="#2a78d6" />
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Egresos por categoría (mes actual)
              </h2>
              <CategoryBarChart data={categoryTotals("egreso")} hue="#eb6834" />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
