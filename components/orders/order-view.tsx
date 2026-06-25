"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { User, ShopSettings } from "@/lib/types";
import { removeOrderItem, updateOrderItemQty } from "@/app/actions/orders";
import AddItemSheet from "./add-item-sheet";
import CloseOrderDialog from "./close-order-dialog";
import { toast } from "sonner";
import { isNetworkError } from "@/lib/is-network-error";
import { cn } from "@/lib/utils";

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
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updating, startUpdate] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const isClosed = order.status === "closed";

  const items = order.order_items ?? [];
  const subtotal = Number(order.subtotal_amount ?? 0);
  const discount = Number(order.discount_amount ?? 0);
  const total = Number(order.total_amount ?? 0);
  const paid = Number(order.amount_paid ?? 0);
  const due = Number(order.balance_due ?? 0);

  function handleRemove(itemId: string) {
    setRemovingId(itemId);
    startRemove(async () => {
      try { await removeOrderItem(order.id, itemId); }
      catch (e: any) {
        if (isNetworkError(e)) toast.error("No internet — item can't be removed right now");
        else toast.error("Something went wrong. Try again.");
      } finally { setRemovingId(null); }
    });
  }

  function handleQtyChange(itemId: string, newQty: number) {
    if (newQty < 0) return;
    setUpdatingId(itemId);
    startUpdate(async () => {
      try {
        if (newQty === 0) await removeOrderItem(order.id, itemId);
        else await updateOrderItemQty(order.id, itemId, newQty);
      } catch (e: any) {
        if (isNetworkError(e)) toast.error("No internet — quantity can't be changed right now");
        else toast.error("Something went wrong. Try again.");
      } finally { setUpdatingId(null); }
    });
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "oklch(0.975 0.006 75)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-stone-100 sticky top-0 z-10"
        style={{ boxShadow: "0 1px 0 oklch(0 0 0 / 0.04)" }}>
        <Link
          href="/"
          className="flex items-center justify-center h-11 w-11 rounded-xl border border-stone-200 text-stone-600 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-stone-900 truncate">
            {order.table?.label ?? "Order"}
          </h1>
          <p className="text-[11px] text-stone-400 font-medium">
            {isClosed ? `Closed · ${(order.payment_status ?? "").replace(/_/g, " ")}` : "Open tab"}
          </p>
        </div>
        {!isClosed && items.length > 0 && (
          <div className="h-6 min-w-6 px-2 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: "oklch(0.72 0.14 58)" }}>
            {items.length}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
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
            {items.map((item: any, i: number) => {
              const isBusy = (updating && updatingId === item.id) || (removing && removingId === item.id);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-3",
                    i < items.length - 1 && "border-b border-stone-50",
                    isBusy && "opacity-50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{item.product_name ?? "—"}</p>
                    <p className="text-xs text-stone-400 mt-0.5">Rs. {Number(item.unit_price).toFixed(0)} each</p>
                  </div>

                  {!isClosed ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleQtyChange(item.id, item.qty - 1)}
                        disabled={isBusy}
                        className="h-9 w-9 rounded-full border border-stone-200 flex items-center justify-center active:bg-stone-100 transition-colors"
                      >
                        {item.qty === 1
                          ? <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          : <Minus className="h-3.5 w-3.5 text-stone-500" />}
                      </button>
                      <span className="w-7 text-center text-sm font-bold text-stone-900 tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => handleQtyChange(item.id, item.qty + 1)}
                        disabled={isBusy}
                        className="h-9 w-9 rounded-full border border-stone-200 flex items-center justify-center active:bg-stone-100 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5 text-stone-500" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-stone-500 shrink-0"
                      style={{ background: "oklch(0.96 0.005 75)" }}>
                      {item.qty}
                    </div>
                  )}

                  <p className="text-sm font-bold text-stone-900 tabular-nums shrink-0 w-14 text-right">
                    Rs.{Number(item.subtotal).toFixed(0)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bill + actions — sticky footer */}
      <div className="bg-white border-t border-stone-100 px-4 pt-4 pb-6 sticky bottom-0 space-y-3"
        style={{ boxShadow: "0 -4px 16px oklch(0 0 0 / 0.06)" }}>
        <div className="rounded-xl px-4 py-3 space-y-1.5 text-sm"
          style={{ background: "oklch(0.975 0.006 75)" }}>
          <div className="flex justify-between text-stone-500">
            <span>Subtotal</span>
            <span className="tabular-nums">Rs. {subtotal.toFixed(0)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600 font-medium">
              <span className="truncate pr-2">Discount{order.discount_reason ? ` · ${order.discount_reason}` : ""}</span>
              <span className="tabular-nums shrink-0">− Rs. {discount.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-stone-900 pt-1.5 border-t border-stone-200">
            <span className="text-base">Total</span>
            <span className="text-base tabular-nums">Rs. {total.toFixed(0)}</span>
          </div>
          {isClosed && (
            <>
              <div className="flex justify-between text-stone-400 text-xs">
                <span>Paid</span>
                <span>Rs. {paid.toFixed(0)}</span>
              </div>
              {due > 0 && (
                <div className="flex justify-between text-sm font-bold text-red-600">
                  <span>Balance due</span>
                  <span>Rs. {due.toFixed(0)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {!isClosed && (
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowAdd(true)}
              className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 active:bg-stone-100 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
            <button
              onClick={() => setShowClose(true)}
              disabled={items.length === 0}
              className="flex-1 h-12 flex items-center justify-center rounded-xl text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "oklch(0.14 0.018 48)" }}
            >
              Close Order
            </button>
          </div>
        )}
      </div>

      {showAdd && <AddItemSheet orderId={order.id} products={products} onClose={() => setShowAdd(false)} />}
      {showClose && <CloseOrderDialog order={order} user={user} settings={settings} onClose={() => setShowClose(false)} />}
    </div>
  );
}
