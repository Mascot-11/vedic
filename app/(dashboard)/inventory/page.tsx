import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import InventoryClient from "@/components/inventory/inventory-client";

export default async function InventoryPage() {
  const [user, db] = [await getCurrentUser(), createAdminClient()];

  const [{ data: brewing }, { data: allocations }, { data: rawBatches }] =
    await Promise.all([
      db.from("brewing_stock").select("*").order("bean_type"),
      db
        .from("stock_allocations")
        .select("*, bean_batch:bean_batches(bean_type)")
        .order("timestamp", { ascending: false })
        .limit(100),
      db
        .from("bean_batches")
        .select("*, stock_allocations(to_pool, qty_grams)")
        .order("created_at", { ascending: false }),
    ]);

  const batches = (rawBatches ?? []).map((b) => {
    const allocs: { to_pool: string; qty_grams: number }[] = b.stock_allocations ?? [];
    return {
      ...b,
      brewing_allocated: allocs
        .filter((a) => a.to_pool === "brewing")
        .reduce((s, a) => s + Number(a.qty_grams), 0),
    };
  });

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-stone-900 mb-6">Bean Inventory</h1>
      <InventoryClient
        brewing={brewing ?? []}
        batches={batches}
        allocations={allocations ?? []}
        user={user!}
      />
    </div>
  );
}
