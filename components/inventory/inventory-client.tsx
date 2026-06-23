"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";
import { BrewingStock, BeanBatch, User } from "@/lib/types";
import AddBatchDialog from "./add-batch-dialog";
import { cn } from "@/lib/utils";

interface Props {
  brewing: BrewingStock[];
  batches: BeanBatch[];
  allocations: any[];
  user: User;
}

export default function InventoryClient({ brewing, batches, allocations }: Props) {
  const [showAddBatch, setShowAddBatch] = useState(false);

  return (
    <>
      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Brewing Stock</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* ── Brewing Stock ── */}
        <TabsContent value="stock" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brewing.map((b) => {
              const isLow = b.qty_remaining_grams <= b.low_stock_threshold_grams;
              return (
                <div
                  key={b.id}
                  className={cn(
                    "bg-white rounded-xl border p-4",
                    isLow ? "border-red-300 bg-red-50" : "border-stone-200"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-stone-900">{b.bean_type}</p>
                    {isLow && <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />}
                  </div>
                  <p className="text-2xl font-bold mt-2 text-stone-900">
                    {Number(b.qty_remaining_grams).toFixed(0)}
                    <span className="text-sm font-normal text-stone-500 ml-1">g</span>
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    Alert below {b.low_stock_threshold_grams}g
                  </p>
                </div>
              );
            })}
            {brewing.length === 0 && (
              <p className="text-sm text-stone-400 col-span-full py-8 text-center">
                No brewing stock yet. Add a batch below.
              </p>
            )}
          </div>
        </TabsContent>

        {/* ── Batches ── */}
        <TabsContent value="batches" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-stone-500">{batches.length} batch{batches.length !== 1 ? "es" : ""}</p>
            <Button size="sm" onClick={() => setShowAddBatch(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Batch
            </Button>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Bean Type</th>
                  <th className="text-right px-4 py-2.5 font-medium text-stone-600">Total (g)</th>
                  <th className="text-right px-4 py-2.5 font-medium text-stone-600">→ Brewing</th>
                  <th className="text-right px-4 py-2.5 font-medium text-stone-600">→ Retail</th>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {batches.map((b: any) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-medium text-stone-900">{b.bean_type}</td>
                    <td className="px-4 py-3 text-right">{Number(b.qty_received_grams).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-amber-700">
                      {Number(b.brewing_allocated ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-600">
                      {Number(b.retail_allocated ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-stone-400 text-xs">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {batches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-stone-400">
                      No batches yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── History ── */}
        <TabsContent value="history" className="mt-4">
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Date</th>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Bean Type</th>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Pool</th>
                  <th className="text-right px-4 py-2.5 font-medium text-stone-600">Grams</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {allocations.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 text-stone-500 text-xs">
                      {new Date(a.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {a.bean_batch?.bean_type ?? "—"}
                    </td>
                    <td className="px-4 py-3 capitalize text-stone-600">{a.to_pool}</td>
                    <td className="px-4 py-3 text-right">{Number(a.qty_grams).toLocaleString()}</td>
                  </tr>
                ))}
                {allocations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-stone-400">
                      No history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {showAddBatch && <AddBatchDialog onClose={() => setShowAddBatch(false)} />}
    </>
  );
}
