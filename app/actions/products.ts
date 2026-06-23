"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

async function requireOwner() {
  const user = await getCurrentUser();
  if (!user || user.role === "staff") throw new Error("Unauthorized");
  return user;
}

export async function upsertDrinkProduct(data: {
  id?: string;
  name: string;
  category: string;
  bean_type_used: string | null;
  grams_per_serving: number | null;
  price: number;
  active: boolean;
}) {
  await requireOwner();
  const db = createAdminClient();

  const { id, ...rest } = data;
  const { error } = id
    ? await db.from("drink_products").update(rest).eq("id", id)
    : await db.from("drink_products").insert(rest);

  if (error) throw new Error(error.message);
  revalidatePath("/products");
}

export async function upsertSimpleProduct(data: {
  id?: string;
  name: string;
  category: string;
  usage_type: "sale" | "cafe_use";
  cost_price: number;
  selling_price: number;
  low_stock_threshold: number;
  qty_available?: number;
}) {
  await requireOwner();
  const db = createAdminClient();

  const { id, ...rest } = data;
  const { error } = id
    ? await db.from("simple_products").update(rest).eq("id", id)
    : await db
        .from("simple_products")
        .insert({ ...rest, qty_available: rest.qty_available ?? 0 });

  if (error) throw new Error(error.message);
  revalidatePath("/products");
}


export async function toggleProductActive(
  table: "drink_products",
  id: string,
  active: boolean
) {
  await requireOwner();
  const db = createAdminClient();
  await db.from(table).update({ active }).eq("id", id);
  revalidatePath("/products");
}
