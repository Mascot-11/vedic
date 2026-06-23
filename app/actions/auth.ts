"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function login(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("invalid") ||
      error.message.toLowerCase().includes("not found")
    ) {
      return { error: "Incorrect email or password." };
    }
    return { error: error.message };
  }

  const authUserId = signInData.user?.id;
  if (!authUserId) return { error: "Sign-in failed. Try again." };

  const db = createAdminClient();
  const { data: profile } = await db
    .from("users")
    .select("active")
    .eq("auth_id", authUserId)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: "Your account is not set up. Contact the administrator." };
  }
  if (!profile.active) {
    await supabase.auth.signOut();
    return { error: "Your account has been deactivated. Contact the administrator." };
  }

  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Client handles navigation after logout
}
