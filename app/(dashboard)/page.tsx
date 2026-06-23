import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import TablesGrid from "@/components/tables/tables-grid";

export default async function TablesPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const [{ data: tables }, { data: openOrders }] = await Promise.all([
    supabase.from("tables").select("*").eq("active", true).order("label"),
    supabase
      .from("orders")
      .select("*, order_items(id, qty, unit_price, subtotal)")
      .eq("status", "open"),
  ]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-stone-900">Tables</h1>
      </div>
      <TablesGrid
        tables={tables ?? []}
        openOrders={openOrders ?? []}
        user={user!}
      />
    </div>
  );
}
