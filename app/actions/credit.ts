"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

async function requireOwner() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "owner" && user.role !== "superadmin")) throw new Error("Unauthorized");
  return user;
}

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

export async function deleteCustomer(customerId: string) {
  await requireOwner();
  const db = createAdminClient();
  // Nullify customer_id on closed orders so history is kept, then delete customer
  await db.from("orders").update({ customer_id: null }).eq("customer_id", customerId);
  const { error } = await db.from("customers").delete().eq("id", customerId);
  if (error) throw new Error(error.message);
  revalidatePath("/credit");
}

export async function writeOffCustomerBalance(customerId: string) {
  await requireOwner();
  const db = createAdminClient();
  // Zero out balance_due on all unpaid closed orders for this customer
  const { error } = await db
    .from("orders")
    .update({ balance_due: 0, payment_status: "paid" })
    .eq("customer_id", customerId)
    .eq("status", "closed")
    .gt("balance_due", 0);
  if (error) throw new Error(error.message);
  revalidatePath("/credit");
}

export async function renameCustomer(customerId: string, name: string) {
  await requireOwner();
  const db = createAdminClient();
  const { error } = await db.from("customers").update({ name: name.trim() }).eq("id", customerId);
  if (error) throw new Error(error.message);
  revalidatePath("/credit");
}
