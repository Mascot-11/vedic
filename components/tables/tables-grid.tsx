"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Clock } from "lucide-react";
import { Table, Order, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import NewOrderDialog from "./new-order-dialog";

interface TablesGridProps {
  tables: Table[];
  openOrders: (Order & { order_items: { id: string; qty: number; unit_price: number; subtotal: number }[] })[];
  user: User;
}

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function TablesGrid({ tables, openOrders, user }: TablesGridProps) {
  const [newOrderTable, setNewOrderTable] = useState<Table | null>(null);
  const orderByTable = Object.fromEntries(openOrders.map((o) => [o.table_id, o]));

  const occupied = tables.filter((t) => orderByTable[t.id]);
  const free = tables.filter((t) => !orderByTable[t.id]);

  return (
    <>
      <div className="space-y-6">
        {/* Occupied tables */}
        {occupied.length > 0 && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
              Open tabs — {occupied.length}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {occupied.map((table) => {
                const order = orderByTable[table.id];
                const itemCount = order.order_items.length;
                const total = Number(order.subtotal_amount ?? 0);
                return (
                  <Link
                    key={table.id}
                    href={`/orders/${order.id}`}
                    className="group relative rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 flex flex-col gap-3 hover:border-amber-400 hover:bg-amber-100 active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-base font-bold text-stone-900">{table.label}</span>
                      <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                        <Clock className="h-3 w-3" />
                        {timeAgo(order.opened_at)}
                      </span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-stone-900">
                        Rs.{total.toFixed(0)}
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Free tables */}
        {free.length > 0 && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
              Available — {free.length}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {free.map((table) => (
                <button
                  key={table.id}
                  onClick={() => setNewOrderTable(table)}
                  className="rounded-2xl border-2 border-dashed border-stone-250 bg-white p-4 flex flex-col gap-3 hover:border-stone-400 hover:bg-stone-50 active:scale-[0.98] transition-all text-left"
                  style={{ borderColor: "oklch(0.88 0.005 80)" }}
                >
                  <span className="text-base font-semibold text-stone-700">{table.label}</span>
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">Open tab</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {tables.length === 0 && (
          <div className="text-center py-20">
            <p className="text-stone-400 text-sm">No tables yet.</p>
            <p className="text-stone-300 text-xs mt-1">Go to Settings to add tables.</p>
          </div>
        )}
      </div>

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
