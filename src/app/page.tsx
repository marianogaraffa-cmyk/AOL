import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/supabase/profile";

export default async function Home() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    redirect("/login");
  }

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}
