import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { User } from "@/lib/types";

export async function getCurrentUser(): Promise<User | null> {
  // Use the session-aware anon client just to read the authenticated user id
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  // Use admin client to fetch the user profile (bypasses RLS)
  const db = createAdminClient();
  const { data } = await db
    .from("users")
    .select("*")
    .eq("auth_id", authUser.id)
    .single();

  return data as User | null;
}
