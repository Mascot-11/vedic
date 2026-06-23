import { createClient } from "@/lib/supabase/server";
import { User } from "@/lib/types";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authUser.id)
    .single();

  return data as User | null;
}
