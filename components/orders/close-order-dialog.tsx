"use client";

import { useState, useTransition, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, ShopSettings } from "@/lib/types";
import { closeOrderAsPaid, closeOrderAsCredit } from "@/app/actions/orders";
import { createClient } from "@/lib/supabase/client";
import { isNetworkError } from "@/lib/is-network-error";
import { enqueue } from "@/lib/offline-queue";
import CustomerSearch from "./customer-search";
import { AlertTriangle, WifiOff } from "lucide-react";

interface UnpaidOrder {
  id: string;
  opened_at: string;
  total_amount: number;
  balance_due: number;
  table: { label: string } | null;
}

interface CustomerCredit {
  total_balance: number;
  unpaid_orders: UnpaidOrder[];
}

interface Props {
  order: any;
  user: User;
  settings: ShopSettings | null;
  onClose: () => void;
}

export default function CloseOrderDialog({ order, user, settings, onClose }: Props) {
  const [tab, setTab] = useState<"paid" | "credit">("paid");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState(0);
  const [customerCredit, setCustomerCredit] = useState<CustomerCredit | null>(null);
  const [loadingCredit, setLoadingCredit] = useState(false);
  const [pending, startTransition] = useTransition();

  const maxStaffDiscount = settings?.max_staff_discount_amount ?? 0;
  const canApplyUnlimitedDiscount = user.role === "superadmin" || user.role === "owner";
  const discountCap = canApplyUnlimitedDiscount ? order.subtotal_amount : maxStaffDiscount;
  const effectiveDiscount = Math.min(discountAmount, order.subtotal_amount);
  const total = order.subtotal_amount - effectiveDiscount;
  const balanceDue = tab === "credit" ? Math.max(0, total - amountPaid) : 0;

  // Fetch customer's outstanding credit whenever a customer is selected
  useEffect(() => {
    if (!customerId) { setCustomerCredit(null); return; }

    setLoadingCredit(true);
    const db = createClient();
    db.from("orders")
      .select("id, opened_at, total_amount, balance_due, table:tables(label)")
      .eq("customer_id", customerId)
      .eq("status", "closed")
      .gt("balance_due", 0)
      .order("opened_at")
      .then(({ data }) => {
        const unpaid = (data ?? []).map((o: any) => ({
          ...o,
          table: Array.isArray(o.table) ? o.table[0] ?? null : o.table,
        }));
        const total_balance = unpaid.reduce((s: number, o: any) => s + Number(o.balance_due), 0);
        setCustomerCredit({ total_balance, unpaid_orders: unpaid });
        setLoadingCredit(false);
      });
  }, [customerId]);

  function handleSelectCustomer(id: string, name: string) {
    setCustomerId(id);
    setCustomerName(name);
  }

  function handleSubmit() {
    if (discountAmount > discountCap && !canApplyUnlimitedDiscount) {
      toast.error(`Discount cannot exceed Rs. ${discountCap} for your role.`);
      return;
    }
    if (discountAmount > order.subtotal_amount) {
      toast.error("Discount cannot exceed the order subtotal.");
      return;
    }
    if (tab === "credit" && !customerId) {
      toast.error("Please select or register a customer.");
      return;
    }
    startTransition(async () => {
      try {
        if (tab === "paid") {
          await closeOrderAsPaid(order.id, effectiveDiscount, discountReason);
        } else {
          await closeOrderAsCredit(order.id, customerId!, amountPaid, effectiveDiscount, discountReason);
        }
      } catch (e: any) {
        if (isNetworkError(e)) {
          // Queue the close for when connectivity returns
          await enqueue(tab === "paid" ? "close_order_paid" : "close_order_credit", {
            orderId: order.id,
            discountAmount: effectiveDiscount,
            discountReason,
            customerId: customerId ?? null,
            amountPaid,
          });
          toast("Order close queued — will sync when online", {
            icon: <WifiOff className="h-4 w-4 text-amber-500" />,
          });
          onClose();
        } else {
          toast.error(e.message);
        }
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Close Order</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "paid" | "credit")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paid">Paid in Full</TabsTrigger>
            <TabsTrigger value="credit">Credit / Partial</TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            {/* Discount row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Discount (Rs.)</Label>
                <Input
                  type="number"
                  min={0}
                  max={discountCap}
                  value={discountAmount || ""}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
                {!canApplyUnlimitedDiscount && (
                  <p className="text-xs text-stone-400">Max Rs. {maxStaffDiscount}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Reason (optional)</Label>
                <Input
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="e.g. Loyalty"
                />
              </div>
            </div>

            <TabsContent value="credit" className="mt-0 space-y-3">
              <div className="space-y-1.5">
                <Label>Customer</Label>
                <CustomerSearch
                  selectedId={customerId}
                  onSelect={handleSelectCustomer}
                />
              </div>

              {/* Existing credit warning */}
              {customerId && !loadingCredit && customerCredit && customerCredit.total_balance > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      {customerName} has Rs. {customerCredit.total_balance.toFixed(2)} outstanding
                    </span>
                  </div>
                  <div className="space-y-1">
                    {customerCredit.unpaid_orders.map((o) => (
                      <div key={o.id} className="flex justify-between text-xs text-red-600">
                        <span>
                          {o.table?.label ?? "?"} · {new Date(o.opened_at).toLocaleDateString()}
                        </span>
                        <span>Rs. {Number(o.balance_due).toFixed(2)} due</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {customerId && !loadingCredit && customerCredit && customerCredit.total_balance === 0 && (
                <p className="text-xs text-green-600">No outstanding balance for this customer.</p>
              )}

              <div className="space-y-1.5">
                <Label>Amount Paid Now (Rs.)</Label>
                <Input
                  type="number"
                  min={0}
                  max={total}
                  value={amountPaid || ""}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </TabsContent>

            {/* Summary */}
            <div className="rounded-lg bg-stone-50 p-3 text-sm space-y-1">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>Rs. {Number(order.subtotal_amount).toFixed(2)}</span>
              </div>
              {effectiveDiscount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>- Rs. {effectiveDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-stone-900 pt-1 border-t border-stone-200">
                <span>Total</span>
                <span>Rs. {total.toFixed(2)}</span>
              </div>
              {tab === "credit" && (
                <>
                  <div className="flex justify-between text-stone-600">
                    <span>Paid now</span>
                    <span>Rs. {amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Balance due</span>
                    <span>Rs. {balanceDue.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={pending} className="bg-stone-900 hover:bg-stone-800">
            {pending ? "Saving…" : "Confirm & Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
