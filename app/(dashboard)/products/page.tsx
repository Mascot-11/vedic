export const revalidate = 60; // re-fetch products at most once per minute

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProductsClient from "@/components/products/products-client";

export default async function ProductsPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "staff") redirect("/");

  const db = createAdminClient();

  const [{ data: drinks }, { data: simpleProducts }, { data: beanBatches }] =
    await Promise.all([
      db.from("drink_products").select("*").order("name"),
      db.from("simple_products").select("*").order("name"),
      db.from("bean_batches").select("bean_type").order("bean_type"),
    ]);

  const beanTypes = [...new Set((beanBatches ?? []).map((b) => b.bean_type))];

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-stone-900 mb-6">Products</h1>
      <ProductsClient
        drinks={drinks ?? []}
        simpleProducts={simpleProducts ?? []}
        beanTypes={beanTypes}
        user={user}
      />
    </div>
  );
}
