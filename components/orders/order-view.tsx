"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User, ShopSettings } from "@/lib/types";
import { removeOrderItem } from "@/app/actions/orders";
import AddItemSheet from "./add-item-sheet";
import CloseOrderDialog from "./close-order-dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface OrderViewProps {
  order: any;
  products: any[];
  user: User;
  settings: ShopSettings | null;
}

export default function OrderView({ order, products, user, settings }: OrderViewProps) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [removing, startRemove] = useTransition();
  const isClosed = order.status === "closed";

  function handleRemove(itemId: string) {
    startRemove(async () => {
      try { await removeOrderItem(order.id, itemId); }
      catch (e: any) { toast.error(e.message); }
    });
  }

  const items = order.order_items ?? [];
  const subtotal = Number(order.subtotal_amount ?? 0);
  const discount = Number(order.discount_amount ?? 0);
  const total = Number(order.total_amount ?? 0);

  return (
    <div className="flex flex-col h-full min-h-screen bg-stone-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-stone-200 sticky top-0 z-10">
        <Link href="/" className="p-2 -ml-2 rounded-xl hover:bg-stone-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-stone-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-stone-900">{order.table?.label ?? "Order"}</h1>
          <p className="text-xs text-stone-500">
            {isClosed
              ? `Closed · ${(order.payment_status ?? "").replace("_", " ")}`
              : "Open tab"}
          </p>
        </div>
        {!isClosed && (
          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-xs px-2.5 py-1">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="h-12 w-12 text-stone-200 mb-3" />
            <p className="text-stone-400 font-medium">No items yet</p>
            <p className="text-stone-300 text-sm mt-0.5">Tap "Add Item" to start</p>
          </div>
        ) : (
          items.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-stone-100"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-900 truncate">{item.product_name ?? "—"}</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  Rs. {Number(item.unit_price).toFixed(0)} × {item.qty}
                </p>
              </div>
              <p className="font-bold text-stone-900 text-sm tabular-nums">
                Rs. {Number(item.subtotal).toFixed(0)}
              </p>
              {!isClosed && (
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={removing}
                  className="p-2 -mr-1 text-stone-300 hover:text-red-500 active:scale-95 transition-all rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Totals + actions */}
      <div className="bg-white border-t border-stone-200 px-4 pt-4 pb-6 space-y-4 sticky bottom-0">
        {/* Bill summary */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-stone-500">
            <span>Subtotal</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount {order.discount_reason ? `(${order.discount_reason})` : ""}</span>
              <span>- Rs. {discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-stone-900 text-base pt-1.5 border-t border-stone-100">
            <span>Total</span>
            <span>Rs. {total.toFixed(2)}</span>
          </div>
          {isClosed && (
            <>
              <div className="flex justify-between text-stone-500 text-xs">
                <span>Paid</span>
                <span>Rs. {Number(order.amount_paid).toFixed(2)}</span>
              </div>
              {Number(order.balance_due) > 0 && (
                <div className="flex justify-between text-red-600 font-semibold text-sm">
                  <span>Balance due</span>
                  <span>Rs. {Number(order.balance_due).toFixed(2)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action buttons */}
        {!isClosed && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 text-sm font-medium rounded-xl border-stone-200"
              onClick={() => setShowAddItem(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Item
            </Button>
            <Button
              className="flex-1 h-12 text-sm font-semibold rounded-xl bg-stone-900 hover:bg-stone-800"
              onClick={() => setShowClose(true)}
              disabled={items.length === 0}
            >
              Close Order
            </Button>
          </div>
        )}
      </div>

      {showAddItem && (
        <AddItemSheet orderId={order.id} products={products} onClose={() => setShowAddItem(false)} />
      )}
      {showClose && (
        <CloseOrderDialog order={order} user={user} settings={settings} onClose={() => setShowClose(false)} />
      )}
    </div>
  );
}
