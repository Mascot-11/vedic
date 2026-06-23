import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import CreditClient from "@/components/credit/credit-client";

export default async function CreditPage() {
  const user = await getCurrentUser();
  const supabase = createAdminClient();

  // Customers with outstanding balance
  const { data: customers } = await supabase
    .from("customers")
    .select(`
      id, name, created_at,
      orders(id, total_amount, balance_due, payment_status, opened_at, table:tables(label))
    `)
    .order("name");

  const customersWithBalance = (customers ?? []).map((c) => ({
    ...c,
    total_balance: c.orders
      .filter((o: any) => o.balance_due > 0)
      .reduce((sum: number, o: any) => sum + Number(o.balance_due), 0),
    unpaid_orders: c.orders
      .filter((o: any) => o.balance_due > 0)
      .map((o: any) => ({
        ...o,
        table: Array.isArray(o.table) ? o.table[0] ?? null : o.table,
      })),
  }));

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-stone-900 mb-6">Credit & Dues</h1>
      <CreditClient customers={customersWithBalance} user={user!} />
    </div>
  );
}
