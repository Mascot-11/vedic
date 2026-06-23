import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import InventoryClient from "@/components/inventory/inventory-client";

export default async function InventoryPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: brewing }, { data: batches }, { data: allocations }] = await Promise.all([
    supabase.from("brewing_stock").select("*").order("bean_type"),
    supabase.from("bean_batches").select("*").order("created_at", { ascending: false }),
    supabase
      .from("stock_allocations")
      .select("*, bean_batch:bean_batches(bean_type, supplier)")
      .order("timestamp", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-stone-900 mb-6">Bean Inventory</h1>
      <InventoryClient
        brewing={brewing ?? []}
        batches={batches ?? []}
        allocations={allocations ?? []}
        user={user!}
      />
    </div>
  );
}
