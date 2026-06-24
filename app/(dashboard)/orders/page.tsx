import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, CheckCircle2, CreditCard } from "lucide-react";

export const revalidate = 60;

export default async function OrderHistoryPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "staff") redirect("/");

  const db = createAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders } = await db
    .from("orders")
    .select("id, status, opened_at, closed_at, total_amount, amount_paid, balance_due, payment_status, discount_amount, table:tables(label), closed_by_user:users!orders_closed_by_fkey(name)")
    .gte("opened_at", since)
    .order("opened_at", { ascending: false });

  const rows = orders ?? [];
  const closed = rows.filter((o) => o.status === "closed");
  const open = rows.filter((o) => o.status === "open");

  const totalRevenue = closed.reduce((s, o) => s + Number(o.total_amount), 0);
  const totalCollected = closed.reduce((s, o) => s + Number(o.amount_paid), 0);

  function fmt(n: number) {
    return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  }

  function timeLabel(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Today · ${time}`;
    if (isYesterday) return `Yesterday · ${time}`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + ` · ${time}`;
  }

  function statusColor(o: typeof rows[0]) {
    if (o.status === "open") return "text-amber-600 bg-amber-50";
    if (o.payment_status === "paid") return "text-green-600 bg-green-50";
    if (o.payment_status === "credit" || o.payment_status === "partially_paid") return "text-red-600 bg-red-50";
    return "text-stone-500 bg-stone-100";
  }

  function statusLabel(o: typeof rows[0]) {
    if (o.status === "open") return "Open";
    if (o.payment_status === "paid") return "Paid";
    if (o.payment_status === "partially_paid") return "Partial";
    if (o.payment_status === "credit") return "Credit";
    return "Closed";
  }

  return (
    <div className="p-5 max-w-2xl">
      <h1 className="text-xl font-bold text-stone-900">Order History</h1>
      <p className="text-sm text-stone-400 mt-0.5 mb-5">Last 7 days</p>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Orders", value: closed.length },
          { label: "Revenue", value: `Rs. ${fmt(totalRevenue)}` },
          { label: "Collected", value: `Rs. ${fmt(totalCollected)}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-stone-100 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{label}</p>
            <p className="text-lg font-bold text-stone-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 text-stone-400 text-sm">No orders in the last 7 days</div>
      ) : (
        <div className="space-y-6">
          {open.length > 0 && (
            <section>
              <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Currently Open</p>
              <div className="rounded-2xl border border-stone-100 bg-white overflow-hidden">
                {open.map((o, i) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors ${i > 0 ? "border-t border-stone-100" : ""}`}
                  >
                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 text-sm">
                        {(o.table as any)?.label ?? "—"}
                      </p>
                      <p className="text-xs text-stone-400">{timeLabel(o.opened_at)}</p>
                    </div>
                    <p className="font-bold text-stone-900 text-sm shrink-0">Rs. {fmt(Number(o.total_amount))}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {closed.length > 0 && (
            <section>
              <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Closed</p>
              <div className="rounded-2xl border border-stone-100 bg-white overflow-hidden">
                {closed.map((o, i) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors ${i > 0 ? "border-t border-stone-100" : ""}`}
                  >
                    {o.payment_status === "paid"
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      : <CreditCard className="h-4 w-4 text-red-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-stone-900 text-sm">
                          {(o.table as any)?.label ?? "—"}
                        </p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor(o)}`}>
                          {statusLabel(o)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400">
                        {timeLabel(o.closed_at ?? o.opened_at)}
                        {(o.closed_by_user as any)?.name ? ` · ${(o.closed_by_user as any).name}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-stone-900 text-sm">Rs. {fmt(Number(o.total_amount))}</p>
                      {Number(o.balance_due) > 0 && (
                        <p className="text-[10px] text-red-500">Due Rs. {fmt(Number(o.balance_due))}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
