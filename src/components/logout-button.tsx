import { signOut } from "@/app/login/actions";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
