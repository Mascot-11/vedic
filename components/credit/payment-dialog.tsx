"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User } from "@/lib/types";
import { recordPayment } from "@/app/actions/credit";

interface UnpaidOrder {
  id: string;
  total_amount: number;
  balance_due: number;
  opened_at: string;
  table: { label: string } | null;
}

interface CustomerWithBalance {
  id: string;
  name: string;
  total_balance: number;
  unpaid_orders: UnpaidOrder[];
}

interface Props {
  customer: CustomerWithBalance;
  user: User;
  onClose: () => void;
}

export default function PaymentDialog({ customer, user, onClose }: Props) {
  const [amount, setAmount] = useState(customer.total_balance);
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  // Manual allocation override: null = use FIFO auto
  const [manualAlloc, setManualAlloc] = useState<Record<string, number> | null>(null);

  function computeFifo(totalAmount: number): Record<string, number> {
    const alloc: Record<string, number> = {};
    let remaining = totalAmount;
    const sorted = [...customer.unpaid_orders].sort(
      (a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime()
    );
    for (const o of sorted) {
      if (remaining <= 0) break;
      const apply = Math.min(remaining, Number(o.balance_due));
      alloc[o.id] = apply;
      remaining -= apply;
    }
    return alloc;
  }

  const effectiveAlloc = manualAlloc ?? computeFifo(amount);
  const allocTotal = Object.values(effectiveAlloc).reduce((s, v) => s + v, 0);

  function handleManualChange(orderId: string, val: number) {
    setManualAlloc((prev) => ({ ...(prev ?? computeFifo(amount)), [orderId]: val }));
  }

  function handleSubmit() {
    if (amount <= 0) {
      toast.error("Enter a payment amount.");
      return;
    }
    const allocations = Object.entries(effectiveAlloc)
      .filter(([, v]) => v > 0)
      .map(([order_id, amount_applied]) => ({ order_id, amount_applied }));

    startTransition(async () => {
      try {
        await recordPayment({
          customer_id: customer.id,
          amount,
          payment_method: method,
          note,
          allocations,
        });
        toast.success("Payment recorded");
        onClose();
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment — {customer.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount Received (Rs.)</Label>
              <Input
                type="number"
                step="0.01"
                value={amount || ""}
                onChange={(e) => {
                  setAmount(parseFloat(e.target.value) || 0);
                  setManualAlloc(null); // reset manual when amount changes
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Method</Label>
              <select
                className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="esewa">eSewa</option>
                <option value="khalti">Khalti</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {/* Allocation breakdown */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Allocation to Orders</Label>
              {manualAlloc && (
                <button
                  className="text-xs text-stone-400 hover:text-stone-700"
                  onClick={() => setManualAlloc(null)}
                >
                  Reset to FIFO
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {customer.unpaid_orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 text-sm py-1">
                  <div className="min-w-0">
                    <p className="font-medium text-stone-800 truncate">{o.table?.label ?? "?"}</p>
                    <p className="text-xs text-stone-400">{new Date(o.opened_at).toLocaleDateString()} · Due Rs. {Number(o.balance_due).toFixed(2)}</p>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={Number(o.balance_due)}
                    value={effectiveAlloc[o.id] ?? 0}
                    onChange={(e) =>
                      handleManualChange(o.id, parseFloat(e.target.value) || 0)
                    }
                    className="w-24 text-right h-10 text-sm shrink-0"
                  />
                </div>
              ))}
              <div className="flex justify-between text-sm font-medium pt-1 border-t border-stone-100">
                <span className="text-stone-500">Allocated total</span>
                <span className={allocTotal > amount ? "text-red-500" : "text-stone-900"}>
                  Rs. {allocTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={pending || allocTotal > amount + 0.01}
          >
            {pending ? "Saving…" : "Confirm Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
