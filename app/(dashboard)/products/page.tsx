import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProductsClient from "@/components/products/products-client";

export default async function ProductsPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "staff") redirect("/");

  const supabase = createAdminClient();

  const [{ data: drinks }, { data: retailStocks }, { data: simpleProducts }] = await Promise.all([
    supabase.from("drink_products").select("*").order("name"),
    supabase.from("retail_stock").select("*").order("bean_type"),
    supabase.from("simple_products").select("*").order("name"),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-stone-900 mb-6">Products</h1>
      <ProductsClient
        drinks={drinks ?? []}
        retailStocks={retailStocks ?? []}
        simpleProducts={simpleProducts ?? []}
        user={user}
      />
    </div>
  );
}
