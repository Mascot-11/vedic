export const revalidate = 15;

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import TablesGrid from "@/components/tables/tables-grid";

export default async function TablesPage() {
  const db = createAdminClient();

  // Run user fetch and DB queries in parallel
  const [user, [{ data: tables }, { data: openOrders }]] = await Promise.all([
    getCurrentUser(),
    Promise.all([
      db.from("tables").select("*").eq("active", true).order("label"),
      db.from("orders")
        .select("*, order_items(id, product_name, qty, unit_price, subtotal)")
        .eq("status", "open"),
    ]),
  ]);

  return (
    <div className="p-4">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-stone-900">Tables</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          {(openOrders ?? []).length} open · {Math.max(0, (tables ?? []).length - (openOrders ?? []).length)} free
        </p>
      </div>
      <TablesGrid tables={tables ?? []} openOrders={openOrders ?? []} user={user!} />
    </div>
  );
}
