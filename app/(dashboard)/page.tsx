import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import TablesGrid from "@/components/tables/tables-grid";

export default async function TablesPage() {
  const db = createAdminClient();
  const user = await getCurrentUser();

  const [{ data: tables }, { data: openOrders }] = await Promise.all([
    db.from("tables").select("*").eq("active", true).order("label"),
    db.from("orders")
      .select("*, order_items(id, qty, unit_price, subtotal)")
      .eq("status", "open"),
  ]);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Tables</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            {(openOrders ?? []).length} open · {(tables ?? []).length - (openOrders ?? []).length} free
          </p>
        </div>
      </div>
      <TablesGrid tables={tables ?? []} openOrders={openOrders ?? []} user={user!} />
    </div>
  );
}
