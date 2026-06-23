"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

async function requireOwner() {
  const user = await getCurrentUser();
  if (!user || user.role === "staff") throw new Error("Unauthorized");
  return user;
}

export async function createTable(label: string) {
  await requireOwner();
  const db = createAdminClient();
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Table name cannot be empty");

  const { error } = await db.from("tables").insert({ label: trimmed, active: true });
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function renameTable(id: string, label: string) {
  await requireOwner();
  const db = createAdminClient();
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Table name cannot be empty");

  const { error } = await db.from("tables").update({ label: trimmed }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function toggleTableActive(id: string, active: boolean) {
  await requireOwner();
  const db = createAdminClient();

  // Cannot deactivate a table with an open order
  if (!active) {
    const { data: open } = await db
      .from("orders")
      .select("id")
      .eq("table_id", id)
      .eq("status", "open")
      .single();
    if (open) throw new Error("Cannot remove a table with an open tab. Close the tab first.");
  }

  const { error } = await db.from("tables").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/settings");
}
