"use client";

import { useState } from "react";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from "lucide-react";
import PaymentDialog from "./payment-dialog";
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

function CustomerRow({ c, onPay }: { c: CustomerWithBalance; onPay: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasDebt = c.total_balance > 0;

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
            <p className="text-sm text-red-600 font-medium">
              Rs. {c.total_balance.toFixed(2)} outstanding
            </p>
          ) : (
            <p className="text-sm text-green-600">All clear</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasDebt && (
            <Button
              size="sm"
              className="h-8 px-3 text-xs rounded-lg"
              onClick={(e) => { e.stopPropagation(); onPay(); }}
            >
              Record Payment
            </Button>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-stone-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-stone-400" />
          )}
        </div>
      </button>

      {expanded && c.unpaid_orders.length > 0 && (
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
    </div>
  );
}

export default function CreditClient({ customers, user }: Props) {
  const [paying, setPaying] = useState<CustomerWithBalance | null>(null);
  const withBalance = customers.filter((c) => c.total_balance > 0);
  const cleared = customers.filter((c) => c.total_balance === 0);
  const totalOwed = withBalance.reduce((s, c) => s + c.total_balance, 0);

  return (
    <>
      {/* Summary banner */}
      {withBalance.length > 0 && (
        <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-red-800">
              Rs. {totalOwed.toFixed(2)} total outstanding
            </p>
            <p className="text-sm text-red-600">{withBalance.length} customer{withBalance.length !== 1 ? "s" : ""} with unpaid dues</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {withBalance.length > 0 && (
          <section className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
              Outstanding Dues
            </p>
            {withBalance.map((c) => (
              <CustomerRow key={c.id} c={c} onPay={() => setPaying(c)} />
            ))}
          </section>
        )}

        {cleared.length > 0 && (
          <section className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
              Cleared
            </p>
            {cleared.map((c) => (
              <CustomerRow key={c.id} c={c} onPay={() => setPaying(c)} />
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
