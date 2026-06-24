"use client";

import { useState, useTransition } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { addItemToOrder } from "@/app/actions/orders";
import { enqueue } from "@/lib/offline-queue";
import { isNetworkError } from "@/lib/is-network-error";
import { toast } from "sonner";
import { Search, WifiOff, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  product_type: "drink" | "simple";
  price: number;
  category: string;
}

interface Props {
  orderId: string;
  products: Product[];
  onClose: () => void;
}

export default function AddItemSheet({ orderId, products, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [adding, setAdding] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  function getQty(id: string) { return qty[id] ?? 1; }
  function bump(id: string, delta: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(1, (prev[id] ?? 1) + delta) }));
  }

  function handleAdd(product: Product) {
    const q = getQty(product.id);
    setAdding(product.id);

    startTransition(async () => {
      try {
        // Always try the live server action first
        await addItemToOrder(orderId, product.id, product.product_type, q);
        toast.success(`${product.name} added`);
        setOffline(false);
        setQty((prev) => ({ ...prev, [product.id]: 1 }));
      } catch (e: any) {
        if (isNetworkError(e)) {
          // Network is gone — queue locally and show feedback
          await enqueue("add_order_item", {
            orderId,
            productId: product.id,
            productType: product.product_type,
            qty: q,
          });
          setOffline(true);
          toast(`${product.name} ×${q} queued — will sync when online`, {
            icon: <WifiOff className="h-4 w-4 text-amber-500" />,
            duration: 4000,
          });
          setQty((prev) => ({ ...prev, [product.id]: 1 }));
        } else {
          // Real server error (e.g. insufficient stock)
          toast.error(e.message);
        }
      } finally {
        setAdding(null);
      }
    });
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-stone-100 shrink-0">
          <SheetTitle className="flex items-center justify-between text-base">
            <span>Add Item</span>
            {offline && (
              <span className="flex items-center gap-1.5 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <WifiOff className="h-3 w-3" /> Offline — items queued
              </span>
            )}
          </SheetTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 rounded-xl border-stone-200 text-base"
              autoFocus
            />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 bg-stone-50 sticky top-0 z-10 border-b border-stone-100">
                {cat}
              </p>
              {items.map((product) => {
                const q = getQty(product.id);
                const isAdding = adding === product.id && pending;
                return (
                  <div
                    key={product.id}
                    className="flex items-center px-4 py-3 border-b border-stone-100 gap-2 active:bg-stone-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 leading-tight truncate">{product.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">Rs. {Number(product.price).toFixed(0)}</p>
                    </div>

                    {/* Qty stepper */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={() => bump(product.id, -1)}
                        className="h-9 w-9 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 active:bg-stone-200 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-stone-900 tabular-nums select-none">
                        {q}
                      </span>
                      <button
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={() => bump(product.id, 1)}
                        className="h-9 w-9 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 active:bg-stone-200 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleAdd(product)}
                      disabled={pending && adding === product.id}
                      className={cn(
                        "h-10 w-14 rounded-xl text-sm font-bold transition-all active:scale-95 shrink-0",
                        isAdding
                          ? "bg-stone-100 text-stone-400 cursor-default"
                          : "bg-stone-900 text-white"
                      )}
                    >
                      {isAdding ? "…" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-stone-400 text-sm">No products found</div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
