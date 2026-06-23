import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { User } from "@/lib/types";

// React cache() deduplicates calls within the same server request
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const db = createAdminClient();
  const { data } = await db
    .from("users")
    .select("*")
    .eq("auth_id", authUser.id)
    .single();

  return data as User | null;
});
