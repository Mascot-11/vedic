"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";
import { BrewingStock, BeanBatch, User } from "@/lib/types";
import AddBatchDialog from "./add-batch-dialog";
import AllocateDialog from "./allocate-dialog";
import { cn } from "@/lib/utils";

interface Props {
  brewing: BrewingStock[];
  batches: BeanBatch[];
  allocations: any[];
  user: User;
}

export default function InventoryClient({ brewing, batches, allocations, user }: Props) {
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [allocateBatch, setAllocateBatch] = useState<BeanBatch | null>(null);
  const canAllocate = user.role !== "staff";

  return (
    <>
      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Brewing Stock</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="movements">History</TabsTrigger>
        </TabsList>

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
                No brewing stock recorded yet. Add a batch and allocate it.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="batches" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-stone-500">{batches.length} batches</p>
            <Button size="sm" onClick={() => setShowAddBatch(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Record Batch
            </Button>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Bean Type</th>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Supplier</th>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Roast Date</th>
                  <th className="text-right px-4 py-2.5 font-medium text-stone-600">Qty (g)</th>
                  <th className="text-right px-4 py-2.5 font-medium text-stone-600">Rs./kg</th>
                  {canAllocate && <th className="w-24" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-medium text-stone-900">{b.bean_type}</td>
                    <td className="px-4 py-3 text-stone-600">{b.supplier}</td>
                    <td className="px-4 py-3 text-stone-600">{b.roast_date}</td>
                    <td className="px-4 py-3 text-right">{Number(b.qty_received_grams).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">Rs. {Number(b.cost_per_kg).toFixed(2)}</td>
                    {canAllocate && (
                      <td className="px-3 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAllocateBatch(b)}
                        >
                          Allocate
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Date</th>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Batch</th>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Pool</th>
                  <th className="text-right px-4 py-2.5 font-medium text-stone-600">Qty (g)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {allocations.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 text-stone-600">
                      {new Date(a.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{a.bean_batch?.bean_type} · {a.bean_batch?.supplier}</td>
                    <td className="px-4 py-3 capitalize text-stone-600">{a.to_pool}</td>
                    <td className="px-4 py-3 text-right">{Number(a.qty_grams).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {showAddBatch && <AddBatchDialog onClose={() => setShowAddBatch(false)} />}
      {allocateBatch && (
        <AllocateDialog batch={allocateBatch} onClose={() => setAllocateBatch(null)} />
      )}
    </>
  );
}
