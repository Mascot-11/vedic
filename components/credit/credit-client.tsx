"use client";

import { useState, useTransition } from "react";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Trash2, Pencil, Eraser, Loader2 } from "lucide-react";
import PaymentDialog from "./payment-dialog";
import { deleteCustomer, writeOffCustomerBalance, renameCustomer } from "@/app/actions/credit";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UnpaidOrder {
  id: string;
  total_amount: number;
  balance_due: number;
  payment_status: string;
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
  customers: CustomerWithBalance[];
  user: User;
}

const isOwner = (u: User) => u.role === "owner" || u.role === "superadmin";

function CustomerRow({ c, owner, onPay }: { c: CustomerWithBalance; owner: boolean; onPay: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(c.name);
  const [pending, start] = useTransition();
  const [actionId, setActionId] = useState<"rename" | "writeoff" | "delete" | null>(null);
  const hasDebt = c.total_balance > 0;

  function handleRename() {
    if (!nameVal.trim() || nameVal.trim() === c.name) { setEditing(false); return; }
    setActionId("rename");
    start(async () => {
      try {
        await renameCustomer(c.id, nameVal.trim());
        toast.success("Name updated");
        setEditing(false);
      } catch (e: any) { toast.error('Something went wrong. Please try again.'); }
      finally { setActionId(null); }
    });
  }

  function handleWriteOff() {
    toast(`Write off Rs. ${c.total_balance.toFixed(2)} for ${c.name}?`, {
      description: "This cannot be undone.",
      action: {
        label: "Write Off",
        onClick: () => {
          setActionId("writeoff");
          start(async () => {
            try {
              await writeOffCustomerBalance(c.id);
              toast.success("Balance cleared — all dues marked as settled");
            } catch (e: any) { toast.error('Something went wrong. Please try again.'); }
            finally { setActionId(null); }
          });
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  }

  function handleDelete() {
    toast(`Delete ${c.name}?`, {
      description: "Their order history will be kept but unlinked.",
      action: {
        label: "Delete",
        onClick: () => {
          setActionId("delete");
          start(async () => {
            try {
              await deleteCustomer(c.id);
              toast.success("Customer removed");
            } catch (e: any) { toast.error('Something went wrong. Please try again.'); }
            finally { setActionId(null); }
          });
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  }

  return (
    <div className={cn(
      "bg-white rounded-2xl border overflow-hidden",
      hasDebt ? "border-red-200" : "border-stone-200"
    )}>
      <button
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-stone-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
          hasDebt ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
        )}>
          {c.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-900">{c.name}</p>
          {hasDebt ? (
            <p className="text-sm text-red-600 font-medium">Rs. {c.total_balance.toFixed(2)} outstanding</p>
          ) : (
            <p className="text-sm text-green-600">All clear</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasDebt && (
            <Button
              size="sm"
              className="h-9 px-2.5 text-xs rounded-lg whitespace-nowrap"
              onClick={(e) => { e.stopPropagation(); onPay(); }}
            >
              Pay
            </Button>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
        </div>
      </button>

      {expanded && (
        <>
          {c.unpaid_orders.length > 0 && (
            <div className="border-t border-stone-100 divide-y divide-stone-100">
              {c.unpaid_orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-stone-800">{o.table?.label ?? "—"}</p>
                    <p className="text-xs text-stone-400">{new Date(o.opened_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-400">Total Rs. {Number(o.total_amount).toFixed(2)}</p>
                    <p className="font-semibold text-red-600">Rs. {Number(o.balance_due).toFixed(2)} due</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {owner && (
            <div className="border-t border-stone-100 px-4 py-3 bg-stone-50 space-y-3">
              {/* Rename */}
              {editing ? (
                <div className="flex gap-2">
                  <Input
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    className="h-8 text-sm flex-1"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditing(false); }}
                  />
                  <Button size="sm" className="h-8 px-3 text-xs" onClick={handleRename} disabled={pending}>
                    {actionId === "rename" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={() => setEditing(false)} disabled={pending}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 px-2.5 py-1.5 rounded-lg hover:bg-stone-200 transition-colors"
                  >
                    <Pencil className="h-3 w-3" /> Rename
                  </button>
                  {hasDebt && (
                    <button
                      onClick={handleWriteOff}
                      disabled={pending}
                      className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      {actionId === "writeoff" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eraser className="h-3 w-3" />}
                      Write Off Balance
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={pending}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors ml-auto"
                  >
                    {actionId === "delete" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    Delete Customer
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CreditClient({ customers, user }: Props) {
  const [paying, setPaying] = useState<CustomerWithBalance | null>(null);
  const owner = isOwner(user);
  const withBalance = customers.filter((c) => c.total_balance > 0);
  const cleared = customers.filter((c) => c.total_balance === 0);
  const totalOwed = withBalance.reduce((s, c) => s + c.total_balance, 0);

  return (
    <>
      {withBalance.length > 0 && (
        <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-red-800">Rs. {totalOwed.toFixed(2)} total outstanding</p>
            <p className="text-sm text-red-600">{withBalance.length} customer{withBalance.length !== 1 ? "s" : ""} with unpaid dues</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {withBalance.length > 0 && (
          <section className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Outstanding Dues</p>
            {withBalance.map((c) => (
              <CustomerRow key={c.id} c={c} owner={owner} onPay={() => setPaying(c)} />
            ))}
          </section>
        )}

        {cleared.length > 0 && (
          <section className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Cleared</p>
            {cleared.map((c) => (
              <CustomerRow key={c.id} c={c} owner={owner} onPay={() => setPaying(c)} />
            ))}
          </section>
        )}

        {customers.length === 0 && (
          <div className="text-center py-20">
            <CheckCircle2 className="h-12 w-12 text-stone-200 mx-auto mb-3" />
            <p className="text-stone-400 font-medium">No credit customers yet</p>
            <p className="text-stone-300 text-sm mt-1">Close an order as Credit to add one</p>
          </div>
        )}
      </div>

      {paying && (
        <PaymentDialog customer={paying} user={user} onClose={() => setPaying(null)} />
      )}
    </>
  );
}
