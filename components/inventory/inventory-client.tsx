"use client";

import { useState, useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, AlertTriangle, Package, Pencil, Trash2, SlidersHorizontal, Loader2 } from "lucide-react";
import { BrewingStock, BeanBatch, User } from "@/lib/types";
import AddBatchDialog from "./add-batch-dialog";
import { updateBrewingThreshold, deleteBatch, manualStockAdjustment } from "@/app/actions/inventory";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  brewing: BrewingStock[];
  batches: BeanBatch[];
  allocations: any[];
  user: User;
}

const isOwner = (u: User) => u.role === "owner" || u.role === "superadmin";

function ThresholdEditor({ b, onDone }: { b: BrewingStock; onDone: () => void }) {
  const [val, setVal] = useState(String(Number(b.low_stock_threshold_grams).toFixed(0)));
  const [pending, start] = useTransition();

  function save() {
    const n = parseInt(val);
    if (isNaN(n) || n < 0) { toast.error("Enter a valid number"); return; }
    start(async () => {
      try {
        await updateBrewingThreshold(b.bean_type, n);
        toast.success("Threshold updated");
        onDone();
      } catch (e: any) { toast.error(e.message); }
    });
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <div className="relative flex-1">
        <Input
          type="number"
          min="0"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="pr-6 h-8 text-sm"
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") onDone(); }}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-400">g</span>
      </div>
      <Button size="sm" className="h-8 px-3 text-xs" onClick={save} disabled={pending}>
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
      </Button>
      <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={onDone} disabled={pending}>
        Cancel
      </Button>
    </div>
  );
}

function AdjustEditor({ b, onDone }: { b: BrewingStock; onDone: () => void }) {
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  function save() {
    const n = parseInt(delta);
    if (isNaN(n) || n === 0) { toast.error("Enter a non-zero amount"); return; }
    start(async () => {
      try {
        await manualStockAdjustment({ bean_type: b.bean_type, change_qty: n, note });
        toast.success("Stock adjusted");
        onDone();
      } catch (e: any) { toast.error(e.message); }
    });
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="+500 or -200"
            className="pr-6 h-8 text-sm"
            autoFocus
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-400">g</span>
        </div>
      </div>
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Reason (optional)"
        className="h-8 text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" className="h-8 px-3 text-xs flex-1" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
        </Button>
        <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function InventoryClient({ brewing, batches, allocations, user }: Props) {
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [editThreshold, setEditThreshold] = useState<string | null>(null);
  const [adjustStock, setAdjustStock] = useState<string | null>(null);
  const [deletingBatch, startDelete] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const owner = isOwner(user);

  function handleDeleteBatch(id: string) {
    if (!confirm("Delete this batch? This cannot be undone.")) return;
    setDeletingId(id);
    startDelete(async () => {
      try {
        await deleteBatch(id);
        toast.success("Batch deleted");
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setDeletingId(null);
      }
    });
  }

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
                const isEditingThreshold = editThreshold === b.bean_type;
                const isAdjusting = adjustStock === b.bean_type;
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
                    <p className="text-xs text-stone-400 mt-1">
                      threshold: {Number(b.low_stock_threshold_grams).toFixed(0)}g
                    </p>

                    {owner && (
                      <>
                        {!isEditingThreshold && !isAdjusting && (
                          <div className="flex gap-1.5 mt-3">
                            <button
                              onClick={() => { setEditThreshold(b.bean_type); setAdjustStock(null); }}
                              className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-700 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors"
                            >
                              <Pencil className="h-3 w-3" /> Threshold
                            </button>
                            <button
                              onClick={() => { setAdjustStock(b.bean_type); setEditThreshold(null); }}
                              className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-700 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors"
                            >
                              <SlidersHorizontal className="h-3 w-3" /> Adjust
                            </button>
                          </div>
                        )}
                        {isEditingThreshold && (
                          <ThresholdEditor b={b} onDone={() => setEditThreshold(null)} />
                        )}
                        {isAdjusting && (
                          <AdjustEditor b={b} onDone={() => setAdjustStock(null)} />
                        )}
                      </>
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
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-xs text-stone-400">
                        {new Date(b.created_at).toLocaleDateString()}
                      </p>
                      {owner && (
                        <button
                          onClick={() => handleDeleteBatch(b.id)}
                          disabled={deletingBatch && deletingId === b.id}
                          className="p-1.5 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          {deletingBatch && deletingId === b.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
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
