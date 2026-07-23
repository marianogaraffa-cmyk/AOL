import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  role: "admin" | "instructor";
  instructor_id: string | null;
};

export async function getCurrentUserAndProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, instructor_id")
    .eq("id", user.id)
    .single<Profile>();

  return { user, profile };
}
