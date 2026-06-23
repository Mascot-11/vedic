"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import { DrinkProduct, SimpleProduct, User } from "@/lib/types";
import DrinkProductDialog from "./drink-product-dialog";
import SimpleProductDialog from "./simple-product-dialog";

function DrinkCard({ d, onEdit }: { d: DrinkProduct; onEdit: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-stone-900">{d.name}</p>
          <Badge variant={d.active ? "default" : "secondary"} className="text-xs">
            {d.active ? "Active" : "Off"}
          </Badge>
        </div>
        <p className="text-xs text-stone-400 mt-0.5">{d.category}</p>
        <div className="flex items-center gap-3 mt-2 text-sm text-stone-600 flex-wrap">
          {d.bean_type_used && (
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
              {d.bean_type_used} · {d.grams_per_serving}g
            </span>
          )}
          <span className="font-semibold text-stone-900">Rs. {Number(d.price).toFixed(0)}</span>
        </div>
      </div>
      <button onClick={onEdit} className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-50 transition-colors shrink-0">
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}

function SimpleCard({ s, onEdit, cafeUse = false }: { s: SimpleProduct; onEdit: () => void; cafeUse?: boolean }) {
  const isLow = s.qty_available <= s.low_stock_threshold;
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-stone-900">{s.name}</p>
        <p className="text-xs text-stone-400 mt-0.5">{s.category}</p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className={`text-sm font-medium ${isLow ? "text-red-600" : "text-stone-500"}`}>
            {s.qty_available} in stock{isLow ? " ⚠" : ""}
          </span>
          {!cafeUse && (
            <span className="text-sm font-semibold text-stone-900">Rs. {Number(s.selling_price).toFixed(0)}</span>
          )}
        </div>
      </div>
      <button onClick={onEdit} className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-50 transition-colors shrink-0">
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}

interface Props {
  drinks: DrinkProduct[];
  simpleProducts: SimpleProduct[];
  beanTypes: string[];
  user: User;
}

export default function ProductsClient({ drinks, simpleProducts, beanTypes }: Props) {
  const [editDrink, setEditDrink] = useState<DrinkProduct | null | "new">(null);
  const [editSimple, setEditSimple] = useState<SimpleProduct | null | "new">(null);

  const saleItems = simpleProducts.filter((s) => s.usage_type !== "cafe_use");
  const cafeItems = simpleProducts.filter((s) => s.usage_type === "cafe_use");

  return (
    <>
      <Tabs defaultValue="drinks">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="drinks" className="flex-1 sm:flex-none">Drinks</TabsTrigger>
          <TabsTrigger value="simple" className="flex-1 sm:flex-none">Snacks & Supplies</TabsTrigger>
        </TabsList>

        <TabsContent value="drinks" className="mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-stone-500">{drinks.length} items</p>
            <Button size="sm" onClick={() => setEditDrink("new")}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>
          {beanTypes.length === 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              No bean batches yet. Add a batch in <strong>Inventory</strong> first.
            </div>
          )}
          {drinks.length === 0 ? (
            <p className="text-center text-stone-400 py-10 text-sm">No drinks yet.</p>
          ) : (
            <div className="space-y-2">
              {drinks.map((d) => (
                <DrinkCard key={d.id} d={d} onEdit={() => setEditDrink(d)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="simple" className="mt-4 space-y-5">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setEditSimple("new")}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>

          {saleItems.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">For Sale</p>
              {saleItems.map((s) => <SimpleCard key={s.id} s={s} onEdit={() => setEditSimple(s)} />)}
            </section>
          )}

          {cafeItems.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Cafe Use Only</p>
              {cafeItems.map((s) => <SimpleCard key={s.id} s={s} onEdit={() => setEditSimple(s)} cafeUse />)}
            </section>
          )}

          {simpleProducts.length === 0 && (
            <p className="text-center text-stone-400 py-10 text-sm">No items yet.</p>
          )}
        </TabsContent>
      </Tabs>

      {editDrink !== null && (
        <DrinkProductDialog
          product={editDrink === "new" ? null : editDrink}
          beanTypes={beanTypes}
          onClose={() => setEditDrink(null)}
        />
      )}
      {editSimple !== null && (
        <SimpleProductDialog
          product={editSimple === "new" ? null : editSimple}
          onClose={() => setEditSimple(null)}
        />
      )}
    </>
  );
}
