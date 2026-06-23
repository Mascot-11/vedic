"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export interface PaymentAllocationInput {
  order_id: string;
  amount_applied: number;
}

export async function recordPayment(data: {
  customer_id: string;
  amount: number;
  payment_method: string;
  note: string;
  allocations: PaymentAllocationInput[];
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const db = createAdminClient();
  const { error } = await db.rpc("record_customer_payment", {
    p_customer_id: data.customer_id,
    p_amount: data.amount,
    p_payment_method: data.payment_method,
    p_note: data.note || null,
    p_allocations: data.allocations,
    p_actor_id: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/credit");
}
