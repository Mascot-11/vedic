"use server";

import { createClient } from "@/lib/supabase/server";

export async function login(
  formData: FormData
): Promise<{ error: string } | { success: true; rememberMe: boolean }> {
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  const rememberMe = formData.get("remember_me") === "on";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (
      error.message.toLowerCase().includes("invalid") ||
      error.message.toLowerCase().includes("not found")
    ) {
      return { error: "Incorrect email or password." };
    }
    return { error: error.message };
  }

  return { success: true, rememberMe };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
