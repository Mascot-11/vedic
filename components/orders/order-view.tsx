"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, ShoppingBag } from "lucide-react";
import { User, ShopSettings } from "@/lib/types";
import { removeOrderItem } from "@/app/actions/orders";
import AddItemSheet from "./add-item-sheet";
import CloseOrderDialog from "./close-order-dialog";
import { toast } from "sonner";
import { isNetworkError } from "@/lib/is-network-error";

interface Props {
  order: any;
  products: any[];
  user: User;
  settings: ShopSettings | null;
}

export default function OrderView({ order, products, user, settings }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [removing, startRemove] = useTransition();
  const isClosed = order.status === "closed";

  const items = order.order_items ?? [];
  const subtotal = Number(order.subtotal_amount ?? 0);
  const discount = Number(order.discount_amount ?? 0);
  const total = Number(order.total_amount ?? 0);
  const paid = Number(order.amount_paid ?? 0);
  const due = Number(order.balance_due ?? 0);

  function handleRemove(itemId: string) {
    startRemove(async () => {
      try { await removeOrderItem(order.id, itemId); }
      catch (e: any) {
        if (isNetworkError(e)) toast.error("You're offline — can't remove items right now");
        else toast.error(e.message);
      }
    });
  }

  return (
    <div className="flex flex-col h-full min-h-screen" style={{ background: "oklch(0.975 0.006 75)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-stone-100 sticky top-0 z-10"
        style={{ boxShadow: "0 1px 0 oklch(0 0 0 / 0.04)" }}>
        <Link
          href="/"
          className="flex items-center justify-center h-9 w-9 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-stone-900 truncate">
            {order.table?.label ?? "Order"}
          </h1>
          <p className="text-[11px] text-stone-400 font-medium">
            {isClosed
              ? `Closed · ${(order.payment_status ?? "").replace(/_/g, " ")}`
              : "Open tab · tap items to manage"}
          </p>
        </div>
        {!isClosed && items.length > 0 && (
          <div className="h-6 min-w-6 px-2 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background: "oklch(0.72 0.14 58)" }}>
            {items.length}
          </div>
        )}
      </div>

      {/* Items — receipt style */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mb-4 shadow-sm">
              <ShoppingBag className="h-7 w-7 text-stone-300" />
            </div>
            <p className="font-semibold text-stone-500">No items yet</p>
            <p className="text-sm text-stone-400 mt-1">Tap "Add Item" below to start</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden"
            style={{ boxShadow: "0 2px 8px oklch(0 0 0 / 0.06)" }}>
            {items.map((item: any, i: number) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5",
                  i < items.length - 1 && "border-b border-stone-50"
                )}
              >
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-stone-500 shrink-0"
                  style={{ background: "oklch(0.96 0.005 75)" }}>
                  {item.qty}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 truncate">{item.product_name ?? "—"}</p>
                  <p className="text-xs text-stone-400 mt-0.5">Rs. {Number(item.unit_price).toFixed(0)} each</p>
                </div>
                <p className="text-sm font-bold text-stone-900 tabular-nums shrink-0">
                  Rs. {Number(item.subtotal).toFixed(0)}
                </p>
                {!isClosed && (
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={removing}
                    className="ml-1 p-1.5 rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bill + actions */}
      <div className="bg-white border-t border-stone-100 px-4 pt-4 pb-6 space-y-4 sticky bottom-0"
        style={{ boxShadow: "0 -4px 16px oklch(0 0 0 / 0.06)" }}>
        {/* Summary */}
        <div className="rounded-xl px-4 py-3 space-y-2 text-sm"
          style={{ background: "oklch(0.975 0.006 75)" }}>
          <div className="flex justify-between text-stone-500">
            <span>Subtotal</span>
            <span className="tabular-nums">Rs. {subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600 font-medium">
              <span>Discount {order.discount_reason ? `· ${order.discount_reason}` : ""}</span>
              <span className="tabular-nums">− Rs. {discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-stone-200">
            <span className="text-base">Total</span>
            <span className="text-base tabular-nums">Rs. {total.toFixed(2)}</span>
          </div>
          {isClosed && (
            <>
              <div className="flex justify-between text-stone-500 text-xs">
                <span>Paid</span>
                <span>Rs. {paid.toFixed(2)}</span>
              </div>
              {due > 0 && (
                <div className="flex justify-between text-sm font-bold"
                  style={{ color: "oklch(0.5 0.18 25)" }}>
                  <span>Balance due</span>
                  <span>Rs. {due.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {!isClosed && (
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowAdd(true)}
              className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50 active:bg-stone-100 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
            <button
              onClick={() => setShowClose(true)}
              disabled={items.length === 0}
              className="flex-1 h-12 flex items-center justify-center rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40"
              style={{ background: "oklch(0.14 0.018 48)" }}
            >
              Close Order
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <AddItemSheet orderId={order.id} products={products} onClose={() => setShowAdd(false)} />
      )}
      {showClose && (
        <CloseOrderDialog order={order} user={user} settings={settings} onClose={() => setShowClose(false)} />
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
