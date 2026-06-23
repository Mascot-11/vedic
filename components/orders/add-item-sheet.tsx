"use client";

import { useState, useTransition } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { addItemToOrder } from "@/app/actions/orders";
import { enqueue } from "@/lib/offline-queue";
import { useOffline } from "@/components/offline-provider";
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
  const [pending, startTransition] = useTransition();
  const { isOnline } = useOffline();

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
  function setProductQty(id: string, n: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(1, n) }));
  }

  function handleAdd(product: Product) {
    const q = getQty(product.id);
    setAdding(product.id);

    if (!isOnline) {
      startTransition(async () => {
        await enqueue("add_order_item", {
          orderId, productId: product.id, productType: product.product_type, qty: q,
        });
        toast.info(`Queued offline: ${product.name} ×${q}`);
        setAdding(null);
        setProductQty(product.id, 1);
      });
      return;
    }

    startTransition(async () => {
      try {
        await addItemToOrder(orderId, product.id, product.product_type, q);
        toast.success(`Added ${product.name}`);
        setProductQty(product.id, 1);
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setAdding(null);
      }
    });
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-stone-100">
          <SheetTitle className="flex items-center justify-between">
            <span>Add Item</span>
            {!isOnline && (
              <span className="flex items-center gap-1.5 text-xs font-normal text-red-500">
                <WifiOff className="h-3.5 w-3.5" /> Offline
              </span>
            )}
          </SheetTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl border-stone-200"
              autoFocus
            />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 bg-stone-50 sticky top-0">
                {cat}
              </p>
              {items.map((product) => {
                const q = getQty(product.id);
                const isAdding = adding === product.id && pending;
                return (
                  <div key={product.id} className="flex items-center px-4 py-3 border-b border-stone-100 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 text-sm leading-tight">{product.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">Rs. {Number(product.price).toFixed(0)}</p>
                    </div>

                    {/* Qty stepper */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setProductQty(product.id, q - 1)}
                        className="h-8 w-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 active:scale-95 transition-all"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold text-stone-900 tabular-nums">{q}</span>
                      <button
                        onClick={() => setProductQty(product.id, q + 1)}
                        className="h-8 w-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 active:scale-95 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleAdd(product)}
                      disabled={pending}
                      className={cn(
                        "h-9 px-4 rounded-xl text-sm font-semibold transition-all active:scale-95",
                        isAdding
                          ? "bg-stone-200 text-stone-500"
                          : "bg-stone-900 text-white hover:bg-stone-700"
                      )}
                    >
                      {isAdding ? "Adding…" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-stone-400 text-sm">
              No products found
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
