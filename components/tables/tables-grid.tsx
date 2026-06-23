"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Table, Order, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import NewOrderDialog from "./new-order-dialog";

interface TablesGridProps {
  tables: Table[];
  openOrders: (Order & { order_items: { id: string; qty: number; unit_price: number; subtotal: number }[] })[];
  user: User;
}

export default function TablesGrid({ tables, openOrders, user }: TablesGridProps) {
  const [newOrderTable, setNewOrderTable] = useState<Table | null>(null);

  const orderByTable = Object.fromEntries(
    openOrders.map((o) => [o.table_id, o])
  );

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map((table) => {
          const order = orderByTable[table.id];
          const hasOrder = !!order;
          const total = order?.subtotal_amount ?? 0;

          return (
            <div key={table.id}>
              {hasOrder ? (
                <Link
                  href={`/orders/${order.id}`}
                  className={cn(
                    "block rounded-xl border-2 p-4 text-sm transition-colors",
                    "border-amber-400 bg-amber-50 hover:bg-amber-100"
                  )}
                >
                  <p className="font-semibold text-stone-900">{table.label}</p>
                  <p className="text-amber-700 mt-1">
                    {order.order_items.length} item{order.order_items.length !== 1 ? "s" : ""}
                  </p>
                  <p className="font-bold text-stone-900 mt-2">
                    Rs. {total.toFixed(2)}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">Open tab</p>
                </Link>
              ) : (
                <button
                  onClick={() => setNewOrderTable(table)}
                  className={cn(
                    "w-full rounded-xl border-2 border-dashed p-4 text-sm transition-colors text-left",
                    "border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50"
                  )}
                >
                  <p className="font-semibold text-stone-700">{table.label}</p>
                  <div className="flex items-center gap-1 text-stone-400 mt-2">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-xs">Open tab</span>
                  </div>
                </button>
              )}
            </div>
          );
        })}
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
