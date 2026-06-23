"use client";

import { useState } from "react";
import { User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import PaymentDialog from "./payment-dialog";

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

export default function CreditClient({ customers, user }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [paying, setPaying] = useState<CustomerWithBalance | null>(null);

  const withBalance = customers.filter((c) => c.total_balance > 0);
  const withoutBalance = customers.filter((c) => c.total_balance === 0);

  function CustomerRow({ c }: { c: CustomerWithBalance }) {
    const isExpanded = expanded === c.id;
    return (
      <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-stone-50"
          onClick={() => setExpanded(isExpanded ? null : c.id)}
        >
          <div>
            <p className="font-medium text-stone-900">{c.name}</p>
            {c.total_balance > 0 && (
              <p className="text-sm text-red-600 font-medium">
                Rs. {c.total_balance.toFixed(2)} outstanding
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {c.total_balance > 0 && (
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); setPaying(c); }}
              >
                Record Payment
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-stone-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-stone-400" />
            )}
          </div>
        </div>

        {isExpanded && c.unpaid_orders.length > 0 && (
          <div className="border-t border-stone-100">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-stone-500">Date</th>
                  <th className="text-left px-4 py-2 font-medium text-stone-500">Table</th>
                  <th className="text-right px-4 py-2 font-medium text-stone-500">Order Total</th>
                  <th className="text-right px-4 py-2 font-medium text-stone-500">Balance Due</th>
                  <th className="text-center px-4 py-2 font-medium text-stone-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {c.unpaid_orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-2.5 text-stone-600">
                      {new Date(o.opened_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-stone-600">
                      {o.table?.label ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      Rs. {Number(o.total_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-red-600">
                      Rs. {Number(o.balance_due).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge variant="secondary" className="capitalize text-xs">
                        {o.payment_status?.replace("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {withBalance.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-2">
              Outstanding Dues ({withBalance.length})
            </h2>
            <div className="space-y-2">
              {withBalance.map((c) => <CustomerRow key={c.id} c={c} />)}
            </div>
          </section>
        )}

        {withoutBalance.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-2 mt-6">
              Cleared Customers ({withoutBalance.length})
            </h2>
            <div className="space-y-2">
              {withoutBalance.map((c) => <CustomerRow key={c.id} c={c} />)}
            </div>
          </section>
        )}

        {customers.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-12">
            No credit customers yet. Close an order as Credit to add one.
          </p>
        )}
      </div>

      {paying && (
        <PaymentDialog
          customer={paying}
          user={user}
          onClose={() => setPaying(null)}
        />
      )}
    </>
  );
}
