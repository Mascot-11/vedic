"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export async function openOrder(tableId: string) {
  const db = createAdminClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { data: existing } = await db
    .from("orders")
    .select("id")
    .eq("table_id", tableId)
    .eq("status", "open")
    .single();

  if (existing) {
    redirect(`/orders/${existing.id}`);
  }

  const { data, error } = await db
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
  const db = createAdminClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await db.rpc("add_order_item", {
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
  const db = createAdminClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await db.rpc("remove_order_item", {
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
  const db = createAdminClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await db.rpc("close_order_paid", {
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
  const db = createAdminClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await db.rpc("close_order_credit", {
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
