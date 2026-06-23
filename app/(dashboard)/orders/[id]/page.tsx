import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import OrderView from "@/components/orders/order-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const [{ data: order }, { data: products }, { data: settings }] = await Promise.all([
    supabase
      .from("orders")
      .select(`
        *,
        table:tables(id, label),
        order_items(
          id, product_id, product_type, qty, unit_price, subtotal, added_at,
          added_by_user:users!order_items_added_by_fkey(name)
        )
      `)
      .eq("id", id)
      .single(),
    supabase.rpc("get_available_products"),
    supabase.from("shop_settings").select("*").single(),
  ]);

  if (!order) notFound();

  return (
    <OrderView
      order={order}
      products={products ?? []}
      user={user!}
      settings={settings}
    />
  );
}
