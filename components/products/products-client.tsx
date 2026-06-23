"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import { DrinkProduct, RetailStock, SimpleProduct, User } from "@/lib/types";
import DrinkProductDialog from "./drink-product-dialog";
import SimpleProductDialog from "./simple-product-dialog";

interface ProductsClientProps {
  drinks: DrinkProduct[];
  retailStocks: RetailStock[];
  simpleProducts: SimpleProduct[];
  user: User;
}

export default function ProductsClient({ drinks, retailStocks, simpleProducts, user }: ProductsClientProps) {
  const [editDrink, setEditDrink] = useState<DrinkProduct | null | "new">(null);
  const [editSimple, setEditSimple] = useState<SimpleProduct | null | "new">(null);

  return (
    <>
      <Tabs defaultValue="drinks">
        <TabsList>
          <TabsTrigger value="drinks">Drinks</TabsTrigger>
          <TabsTrigger value="retail">Retail Beans</TabsTrigger>
          <TabsTrigger value="simple">Snacks & Pastries</TabsTrigger>
        </TabsList>

        <TabsContent value="drinks" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-stone-500">{drinks.length} drink products</p>
            <Button size="sm" onClick={() => setEditDrink("new")}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Drink
            </Button>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Name</th>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Category</th>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Bean</th>
                  <th className="text-right px-4 py-2.5 font-medium text-stone-600">g/serving</th>
                  <th className="text-right px-4 py-2.5 font-medium text-stone-600">Price</th>
                  <th className="text-center px-4 py-2.5 font-medium text-stone-600">Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {drinks.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-medium text-stone-900">{d.name}</td>
                    <td className="px-4 py-3 text-stone-600">{d.category}</td>
                    <td className="px-4 py-3 text-stone-600">{d.bean_type_used}</td>
                    <td className="px-4 py-3 text-right text-stone-600">{d.grams_per_serving}g</td>
                    <td className="px-4 py-3 text-right">Rs. {Number(d.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={d.active ? "default" : "secondary"}>
                        {d.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => setEditDrink(d)}
                        className="p-1 text-stone-400 hover:text-stone-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="retail" className="mt-4">
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Bean Type</th>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Package Size</th>
                  <th className="text-right px-4 py-2.5 font-medium text-stone-600">Qty Available</th>
                  <th className="text-right px-4 py-2.5 font-medium text-stone-600">Selling Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {retailStocks.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium text-stone-900">{r.bean_type}</td>
                    <td className="px-4 py-3 text-stone-600">{r.packaging_size}</td>
                    <td className="px-4 py-3 text-right text-stone-600">{r.qty_available}</td>
                    <td className="px-4 py-3 text-right">Rs. {Number(r.selling_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="simple" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-stone-500">{simpleProducts.length} items</p>
            <Button size="sm" onClick={() => setEditSimple("new")}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
            </Button>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Name</th>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Category</th>
                  <th className="text-right px-4 py-2.5 font-medium text-stone-600">Stock</th>
                  <th className="text-right px-4 py-2.5 font-medium text-stone-600">Sell Price</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {simpleProducts.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-stone-900">{s.name}</td>
                    <td className="px-4 py-3 text-stone-600">{s.category}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={s.qty_available <= s.low_stock_threshold ? "text-red-600 font-medium" : "text-stone-600"}>
                        {s.qty_available}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">Rs. {Number(s.selling_price).toFixed(2)}</td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => setEditSimple(s)}
                        className="p-1 text-stone-400 hover:text-stone-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {editDrink !== null && (
        <DrinkProductDialog
          product={editDrink === "new" ? null : editDrink}
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
