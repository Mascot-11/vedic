"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export async function createBatch(data: {
  bean_type: string;
  total_grams: number;
  brewing_grams: number;
  retail_grams: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const db = createAdminClient();
  const { error } = await db.rpc("create_batch_with_allocation", {
    p_bean_type: data.bean_type.trim(),
    p_total_grams: data.total_grams,
    p_brewing_grams: data.brewing_grams,
    p_retail_grams: data.retail_grams,
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
