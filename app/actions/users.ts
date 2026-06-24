"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: "owner" | "staff";
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthorized");

  // Only superadmin can create owners; owner can only create staff
  if (data.role === "owner" && currentUser.role !== "superadmin") {
    throw new Error("Only superadmin can create owner accounts");
  }
  if (currentUser.role === "staff") {
    throw new Error("Staff cannot create users");
  }

  const db = createAdminClient();

  // Create auth user with email pre-confirmed (no verification email)
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error("Failed to create auth user");

  // Insert into users table
  const { error: dbError } = await db.from("users").insert({
    name: data.name,
    role: data.role,
    auth_id: authData.user.id,
    active: true,
  });

  if (dbError) {
    // Clean up auth user if db insert fails
    await db.auth.admin.deleteUser(authData.user.id);
    throw new Error(dbError.message);
  }

  revalidatePath("/users");
}

export async function toggleUserActive(userId: string, active: boolean) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role === "staff") throw new Error("Unauthorized");
  // Owners can only deactivate staff
  const db = createAdminClient();
  if (currentUser.role === "owner") {
    const { data: target } = await db
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
    if (target?.role !== "staff") throw new Error("Owners can only manage staff accounts");
  }
  await db.from("users").update({ active }).eq("id", userId);
  revalidatePath("/users");
}

export async function deleteUser(userId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "superadmin") throw new Error("Unauthorized");
  if (currentUser.id === userId) throw new Error("Cannot delete your own account");

  const db = createAdminClient();
  const { data: target } = await db.from("users").select("role, auth_id").eq("id", userId).single();
  if (!target) throw new Error("User not found");
  if (target.role === "superadmin") throw new Error("Cannot delete another superadmin");

  await db.from("users").delete().eq("id", userId);
  if (target.auth_id) await db.auth.admin.deleteUser(target.auth_id);
  revalidatePath("/users");
}

export async function changePassword(newPassword: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}
