"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  bean_type_used: string;
  grams_per_serving: number;
  price: number;
  active: boolean;
}) {
  await requireOwner();
  const supabase = await createClient();

  const { error } = data.id
    ? await supabase.from("drink_products").update(data).eq("id", data.id)
    : await supabase.from("drink_products").insert(data);

  if (error) throw new Error(error.message);
  revalidatePath("/products");
}

export async function upsertSimpleProduct(data: {
  id?: string;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  low_stock_threshold: number;
  qty_available?: number;
}) {
  await requireOwner();
  const supabase = await createClient();

  const { error } = data.id
    ? await supabase.from("simple_products").update(data).eq("id", data.id)
    : await supabase.from("simple_products").insert({ ...data, qty_available: data.qty_available ?? 0 });

  if (error) throw new Error(error.message);
  revalidatePath("/products");
}

export async function upsertRetailStock(data: {
  id?: string;
  bean_type: string;
  packaging_size: string;
  qty_available: number;
  selling_price: number;
}) {
  await requireOwner();
  const supabase = await createClient();

  const { error } = data.id
    ? await supabase.from("retail_stock").update(data).eq("id", data.id)
    : await supabase.from("retail_stock").insert(data);

  if (error) throw new Error(error.message);
  revalidatePath("/products");
}

export async function toggleProductActive(
  table: "drink_products",
  id: string,
  active: boolean
) {
  await requireOwner();
  const supabase = await createClient();
  await supabase.from(table).update({ active }).eq("id", id);
  revalidatePath("/products");
}
