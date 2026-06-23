"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Clock, UtensilsCrossed, ArrowRight } from "lucide-react";
import { Table, Order, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import NewOrderDialog from "./new-order-dialog";

type OrderItem = { id: string; product_name: string | null; qty: number; unit_price: number; subtotal: number };
type OpenOrder = Order & { order_items: OrderItem[] };

interface TablesGridProps {
  tables: Table[];
  openOrders: OpenOrder[];
  user: User;
}

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function TablesGrid({ tables, openOrders, user }: TablesGridProps) {
  const router = useRouter();
  const [newOrderTable, setNewOrderTable] = useState<Table | null>(null);
  const [drilldown, setDrilldown] = useState<{ table: Table; order: OpenOrder } | null>(null);

  const orderByTable = Object.fromEntries(openOrders.map((o) => [o.table_id, o]));
  const occupied = tables.filter((t) => orderByTable[t.id]);
  const free = tables.filter((t) => !orderByTable[t.id]);

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-14 w-14 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mb-4 shadow-sm">
          <UtensilsCrossed className="h-6 w-6 text-stone-300" />
        </div>
        <p className="font-semibold text-stone-600">No tables yet</p>
        <p className="text-sm text-stone-400 mt-1">Go to Settings → Tables to add them</p>
      </div>
    );
  }

  const dd = drilldown;
  const ddItems = dd?.order.order_items ?? [];
  const ddTotal = Number(dd?.order.subtotal_amount ?? 0);

  return (
    <>
      <div className="space-y-8">
        {/* Occupied */}
        {occupied.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                Open tabs · {occupied.length}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {occupied.map((table) => {
                const order = orderByTable[table.id];
                const total = Number(order.subtotal_amount ?? 0);
                const count = order.order_items.length;
                return (
                  <button
                    key={table.id}
                    onClick={() => setDrilldown({ table, order })}
                    className="group relative rounded-2xl p-4 flex flex-col gap-2 active:scale-[0.97] transition-transform select-none overflow-hidden text-left w-full"
                    style={{
                      background: "linear-gradient(135deg, oklch(0.96 0.05 75), oklch(0.92 0.07 70))",
                      border: "1px solid oklch(0.86 0.08 70)",
                      boxShadow: "0 1px 3px oklch(0.7 0.08 70 / 0.2), 0 4px 16px oklch(0.7 0.08 70 / 0.08)",
                    }}
                  >
                    <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-20"
                      style={{ background: "oklch(0.72 0.14 58)" }} />

                    <div className="flex items-start justify-between relative">
                      <span className="text-sm font-bold text-stone-800">{table.label}</span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold"
                        style={{ color: "oklch(0.52 0.1 58)" }}>
                        <Clock className="h-3 w-3" />
                        {timeAgo(order.opened_at)}
                      </span>
                    </div>

                    <div className="relative">
                      <p className="text-2xl font-extrabold text-stone-900 leading-none">
                        Rs.{total.toFixed(0)}
                      </p>
                      <p className="text-xs font-medium mt-1"
                        style={{ color: "oklch(0.5 0.08 58)" }}>
                        {count} item{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Free */}
        {free.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">
              Available · {free.length}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {free.map((table) => (
                <button
                  key={table.id}
                  onClick={() => setNewOrderTable(table)}
                  className="group rounded-2xl p-4 flex flex-col gap-3 text-left active:scale-[0.97] transition-all select-none"
                  style={{
                    background: "oklch(1 0 0)",
                    border: "1.5px dashed oklch(0.85 0.008 75)",
                    boxShadow: "0 1px 2px oklch(0 0 0 / 0.04)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.7 0.01 55)";
                    (e.currentTarget as HTMLElement).style.background = "oklch(0.98 0.004 75)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.85 0.008 75)";
                    (e.currentTarget as HTMLElement).style.background = "oklch(1 0 0)";
                  }}
                >
                  <span className="text-sm font-bold text-stone-700">{table.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-full border border-stone-200 flex items-center justify-center"
                      style={{ color: "oklch(0.6 0.01 55)" }}>
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium text-stone-400">Open tab</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Drilldown sheet */}
      <Sheet open={!!dd} onOpenChange={(open) => !open && setDrilldown(null)}>
        <SheetContent side="bottom" showCloseButton className="rounded-t-3xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="pb-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base font-bold text-stone-900">
                {dd?.table.label}
              </SheetTitle>
              {dd && (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                  <Clock className="h-3 w-3" />
                  {timeAgo(dd.order.opened_at)}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400">{ddItems.length} item{ddItems.length !== 1 ? "s" : ""}</p>
          </SheetHeader>

          {/* Items list */}
          <div className="px-4 py-3 space-y-0.5">
            {ddItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-stone-400 w-5 text-center shrink-0">×{item.qty}</span>
                  <span className="text-sm text-stone-800 truncate">{item.product_name ?? "—"}</span>
                </div>
                <span className="text-sm font-semibold text-stone-900 shrink-0 ml-3">
                  Rs.{Number(item.subtotal).toFixed(0)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mx-4 rounded-xl bg-stone-50 border border-stone-200 px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-stone-500">Subtotal</span>
            <span className="text-lg font-extrabold text-stone-900">Rs.{ddTotal.toFixed(0)}</span>
          </div>

          <SheetFooter className="pt-3">
            <Button
              className="w-full"
              onClick={() => { if (dd) router.push(`/orders/${dd.order.id}`); }}
            >
              Open Order <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {newOrderTable && (
        <NewOrderDialog
          table={newOrderTable}
          user={user}
          onClose={() => setNewOrderTable(null)}
        />
      )}
    </>
  );
}
