"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export async function createBatch(data: {
  bean_type: string;
  name: string;
  remarks: string;
  total_grams: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const db = createAdminClient();
  const { error } = await db.rpc("create_batch_with_allocation", {
    p_bean_type:   data.bean_type.trim(),
    p_name:        data.name.trim() || null,
    p_remarks:     data.remarks.trim() || null,
    p_total_grams: data.total_grams,
    p_actor_id:    user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
}

export async function manualStockAdjustment(data: {
  bean_type: string;
  change_qty: number;
  note: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role === "staff") throw new Error("Unauthorized");

  const db = createAdminClient();
  const { error } = await db.rpc("manual_stock_adjustment", {
    p_bean_type:  data.bean_type,
    p_pool:       "brewing",
    p_change_qty: data.change_qty,
    p_note:       data.note,
    p_actor_id:   user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
}
