"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export async function addBeanBatch(data: {
  bean_type: string;
  roast_date: string;
  supplier: string;
  cost_per_kg: number;
  qty_received_grams: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const db = createAdminClient();
  const { error } = await db.from("bean_batches").insert({
    ...data,
    added_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
}

export async function allocateBatch(data: {
  from_batch_id: string;
  to_pool: "retail" | "brewing";
  qty_grams: number;
}) {
  const user = await getCurrentUser();
  if (!user || user.role === "staff") throw new Error("Unauthorized");

  const db = createAdminClient();
  const { error } = await db.rpc("allocate_bean_batch", {
    p_batch_id: data.from_batch_id,
    p_pool: data.to_pool,
    p_qty_grams: data.qty_grams,
    p_actor_id: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
}

export async function manualStockAdjustment(data: {
  bean_type: string;
  pool: "brewing" | "retail";
  change_qty: number;
  note: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role === "staff") throw new Error("Unauthorized");

  const db = createAdminClient();
  const { error } = await db.rpc("manual_stock_adjustment", {
    p_bean_type: data.bean_type,
    p_pool: data.pool,
    p_change_qty: data.change_qty,
    p_note: data.note,
    p_actor_id: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
}
