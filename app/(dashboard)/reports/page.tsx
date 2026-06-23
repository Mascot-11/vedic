import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportsDashboard from "@/components/reports/reports-dashboard";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "staff") redirect("/");

  const supabase = createAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [
    { data: dailyOrders },
    { data: weeklyOrders },
    { data: monthlyOrders },
    { data: topProducts },
    { data: brewing },
    { data: totalDues },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total_amount, amount_paid, balance_due, payment_status")
      .eq("status", "closed")
      .gte("closed_at", startOfDay),
    supabase
      .from("orders")
      .select("total_amount, amount_paid, balance_due, payment_status")
      .eq("status", "closed")
      .gte("closed_at", startOfWeek),
    supabase
      .from("orders")
      .select("total_amount, amount_paid, balance_due, payment_status")
      .eq("status", "closed")
      .gte("closed_at", startOfMonth),
    supabase.rpc("get_top_products", { p_limit: 10 }),
    supabase.from("brewing_stock").select("bean_type, qty_remaining_grams, low_stock_threshold_grams"),
    supabase
      .from("orders")
      .select("balance_due")
      .eq("status", "closed")
      .gt("balance_due", 0),
  ]);

  const calcPeriod = (orders: any[]) => ({
    revenue: orders?.reduce((s, o) => s + Number(o.total_amount), 0) ?? 0,
    collected: orders?.reduce((s, o) => s + Number(o.amount_paid), 0) ?? 0,
    count: orders?.length ?? 0,
  });

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-stone-900 mb-6">Reports</h1>
      <ReportsDashboard
        daily={calcPeriod(dailyOrders ?? [])}
        weekly={calcPeriod(weeklyOrders ?? [])}
        monthly={calcPeriod(monthlyOrders ?? [])}
        topProducts={topProducts ?? []}
        brewing={brewing ?? []}
        totalDues={(totalDues ?? []).reduce((s, o) => s + Number(o.balance_due), 0)}
      />
    </div>
  );
}
