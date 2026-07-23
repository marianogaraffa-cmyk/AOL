import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <form
        action={signIn}
        className="w-full max-w-sm space-y-4 rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            AOL · Performance de Instructores
          </h1>
          <p className="text-sm text-neutral-500">Ingresá con tu cuenta</p>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Contraseña
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          Ingresar
        </button>
      </form>
    </main>
  );
}
