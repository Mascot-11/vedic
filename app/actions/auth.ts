"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function login(
  formData: FormData
): Promise<{ error: string } | void> {
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Don't expose internal error messages to the client
    if (
      error.message.toLowerCase().includes("invalid") ||
      error.message.toLowerCase().includes("not found")
    ) {
      return { error: "Incorrect email or password." };
    }
    return { error: error.message };
  }

  // Check the user's profile exists and is active
  const user = await getCurrentUser();
  if (!user) {
    await supabase.auth.signOut();
    return { error: "Your account is not set up. Contact the administrator." };
  }
  if (!user.active) {
    await supabase.auth.signOut();
    return { error: "Your account has been deactivated. Contact the administrator." };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
