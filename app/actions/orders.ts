"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function openOrder(tableId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Check no open order exists for this table
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("table_id", tableId)
    .eq("status", "open")
    .single();

  if (existing) {
    redirect(`/orders/${existing.id}`);
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({
      table_id: tableId,
      status: "open",
      opened_by: user.id,
      subtotal_amount: 0,
      discount_amount: 0,
      total_amount: 0,
      amount_paid: 0,
      balance_due: 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect(`/orders/${data.id}`);
}

export async function addItemToOrder(
  orderId: string,
  productId: string,
  productType: "drink" | "retail_bean" | "simple",
  qty: number
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Use RPC for atomic stock deduction + item insert
  const { error } = await supabase.rpc("add_order_item", {
    p_order_id: orderId,
    p_product_id: productId,
    p_product_type: productType,
    p_qty: qty,
    p_actor_id: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/orders/${orderId}`);
}

export async function removeOrderItem(orderId: string, itemId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.rpc("remove_order_item", {
    p_item_id: itemId,
    p_actor_id: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/orders/${orderId}`);
}

export async function closeOrderAsPaid(
  orderId: string,
  discountAmount: number,
  discountReason: string
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.rpc("close_order_paid", {
    p_order_id: orderId,
    p_discount_amount: discountAmount,
    p_discount_reason: discountReason || null,
    p_actor_id: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/orders/${orderId}`);
  redirect("/");
}

export async function closeOrderAsCredit(
  orderId: string,
  customerId: string,
  amountPaid: number,
  discountAmount: number,
  discountReason: string
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.rpc("close_order_credit", {
    p_order_id: orderId,
    p_customer_id: customerId,
    p_amount_paid: amountPaid,
    p_discount_amount: discountAmount,
    p_discount_reason: discountReason || null,
    p_actor_id: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/orders/${orderId}`);
  redirect("/");
}
