"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Package } from "lucide-react";
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
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="stock" className="flex-1 sm:flex-none">Stock</TabsTrigger>
          <TabsTrigger value="batches" className="flex-1 sm:flex-none">Batches</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 sm:flex-none">History</TabsTrigger>
        </TabsList>

        {/* Brewing stock cards */}
        <TabsContent value="stock" className="mt-4">
          {brewing.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-10 w-10 text-stone-200 mx-auto mb-3" />
              <p className="text-stone-400 text-sm">No brewing stock yet.</p>
              <p className="text-stone-300 text-xs mt-1">Add a batch to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {brewing.map((b) => {
                const isLow = b.qty_remaining_grams <= b.low_stock_threshold_grams;
                return (
                  <div
                    key={b.id}
                    className={cn(
                      "rounded-2xl border p-4",
                      isLow ? "border-red-200 bg-red-50" : "bg-white border-stone-200"
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-semibold text-stone-900 text-sm leading-tight">{b.bean_type}</p>
                      {isLow && <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                    </div>
                    <p className="text-3xl font-bold mt-3 text-stone-900">
                      {Number(b.qty_remaining_grams).toFixed(0)}
                      <span className="text-sm font-normal text-stone-400 ml-1">g</span>
                    </p>
                    {isLow && (
                      <p className="text-xs text-red-500 mt-1 font-medium">Low stock</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Batches */}
        <TabsContent value="batches" className="mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-stone-500">{batches.length} batch{batches.length !== 1 ? "es" : ""}</p>
            <Button size="sm" onClick={() => setShowAddBatch(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Batch
            </Button>
          </div>

          {batches.length === 0 ? (
            <p className="text-center text-stone-400 py-10 text-sm">No batches yet.</p>
          ) : (
            <div className="space-y-2">
              {batches.map((b: any) => (
                <div key={b.id} className="bg-white rounded-2xl border border-stone-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900">{b.name || b.bean_type}</p>
                      {b.name && <p className="text-xs text-stone-400">{b.bean_type}</p>}
                      {b.remarks && <p className="text-xs text-stone-400 mt-1 italic">{b.remarks}</p>}
                    </div>
                    <p className="text-xs text-stone-400 shrink-0">
                      {new Date(b.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-xs text-stone-400">Total</p>
                      <p className="font-semibold text-stone-900">{Number(b.qty_received_grams).toLocaleString()}g</p>
                    </div>
                    <div className="text-stone-200">|</div>
                    <div>
                      <p className="text-xs text-amber-600">Brewing</p>
                      <p className="font-semibold text-stone-900">{Number(b.brewing_allocated ?? 0).toLocaleString()}g</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-4 space-y-2">
          {allocations.length === 0 ? (
            <p className="text-center text-stone-400 py-10 text-sm">No history yet.</p>
          ) : (
            allocations.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-stone-100 px-4 py-3 flex items-center justify-between text-sm gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-stone-900 truncate">{a.bean_batch?.bean_type ?? "—"}</p>
                  <p className="text-xs text-stone-400">{new Date(a.timestamp).toLocaleDateString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-stone-900">{Number(a.qty_grams).toLocaleString()}g</p>
                  <p className="text-xs text-stone-400 capitalize">{a.to_pool}</p>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {showAddBatch && <AddBatchDialog onClose={() => setShowAddBatch(false)} />}
    </>
  );
}
