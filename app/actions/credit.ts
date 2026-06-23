"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_customer_payment", {
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
