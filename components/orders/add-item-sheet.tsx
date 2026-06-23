"use client";

import { useState, useTransition } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addItemToOrder } from "@/app/actions/orders";
import { toast } from "sonner";
import { Search } from "lucide-react";

interface Product {
  id: string;
  name: string;
  product_type: "drink" | "retail_bean" | "simple";
  price: number;
  category: string;
}

interface AddItemSheetProps {
  orderId: string;
  products: Product[];
  onClose: () => void;
}

export default function AddItemSheet({ orderId, products, onClose }: AddItemSheetProps) {
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
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

  function handleAdd(product: Product) {
    const q = qty[product.id] ?? 1;
    startTransition(async () => {
      try {
        await addItemToOrder(orderId, product.id, product.product_type, q);
        toast.success(`${product.name} added`);
        setQty((prev) => ({ ...prev, [product.id]: 1 }));
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-4 py-4 border-b">
          <SheetTitle>Add Item</SheetTitle>
        </SheetHeader>
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-130px)]">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-stone-400 bg-stone-50 border-b border-stone-100">
                {cat}
              </p>
              {items.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-stone-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{product.name}</p>
                    <p className="text-xs text-stone-500">Rs. {Number(product.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={qty[product.id] ?? 1}
                      onChange={(e) =>
                        setQty((prev) => ({
                          ...prev,
                          [product.id]: Math.max(1, parseInt(e.target.value) || 1),
                        }))
                      }
                      className="w-14 text-center h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAdd(product)}
                      disabled={pending}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-stone-400 text-center py-10">No products found.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
