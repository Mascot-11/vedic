"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User, ShopSettings } from "@/lib/types";
import { removeOrderItem } from "@/app/actions/orders";
import AddItemSheet from "./add-item-sheet";
import CloseOrderDialog from "./close-order-dialog";
import { useTransition } from "react";
import { toast } from "sonner";

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
      try {
        await removeOrderItem(order.id, itemId);
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-stone-500 hover:text-stone-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-stone-900">
            {order.table?.label ?? "Unknown Table"}
          </h1>
          <p className="text-sm text-stone-500 capitalize">
            {isClosed ? `Closed · ${order.payment_status?.replace("_", " ")}` : "Open tab"}
          </p>
        </div>
      </div>

      {/* Items list */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden mb-4">
        {order.order_items?.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-10">No items yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-stone-600">Item</th>
                <th className="text-right px-4 py-2.5 font-medium text-stone-600">Qty</th>
                <th className="text-right px-4 py-2.5 font-medium text-stone-600">Price</th>
                <th className="text-right px-4 py-2.5 font-medium text-stone-600">Total</th>
                {!isClosed && <th className="w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {order.order_items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-stone-900">{item.product_name ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-stone-600">{item.qty}</td>
                  <td className="px-4 py-3 text-right text-stone-600">
                    Rs. {Number(item.unit_price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    Rs. {Number(item.subtotal).toFixed(2)}
                  </td>
                  {!isClosed && (
                    <td className="px-2 py-3 text-right">
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removing}
                        className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totals */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4 space-y-2 text-sm">
        <div className="flex justify-between text-stone-600">
          <span>Subtotal</span>
          <span>Rs. {Number(order.subtotal_amount).toFixed(2)}</span>
        </div>
        {order.discount_amount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Discount {order.discount_reason ? `(${order.discount_reason})` : ""}</span>
            <span>- Rs. {Number(order.discount_amount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-stone-900 pt-1 border-t border-stone-100">
          <span>Total</span>
          <span>Rs. {Number(order.total_amount).toFixed(2)}</span>
        </div>
        {isClosed && (
          <>
            <div className="flex justify-between text-stone-600">
              <span>Paid</span>
              <span>Rs. {Number(order.amount_paid).toFixed(2)}</span>
            </div>
            {order.balance_due > 0 && (
              <div className="flex justify-between text-red-600 font-medium">
                <span>Balance Due</span>
                <span>Rs. {Number(order.balance_due).toFixed(2)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {!isClosed && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowAddItem(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Item
          </Button>
          <Button
            className="flex-1 bg-stone-900 hover:bg-stone-800"
            onClick={() => setShowClose(true)}
            disabled={order.order_items?.length === 0}
          >
            Close Order
          </Button>
        </div>
      )}

      {showAddItem && (
        <AddItemSheet
          orderId={order.id}
          products={products}
          onClose={() => setShowAddItem(false)}
        />
      )}

      {showClose && (
        <CloseOrderDialog
          order={order}
          user={user}
          settings={settings}
          onClose={() => setShowClose(false)}
        />
      )}
    </div>
  );
}
