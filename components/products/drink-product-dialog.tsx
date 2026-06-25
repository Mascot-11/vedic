"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DrinkProduct } from "@/lib/types";
import { upsertDrinkProduct } from "@/app/actions/products";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  is_coffee: z.boolean(),
  bean_type_used: z.string().optional(),
  grams_per_serving: z.coerce.number().optional(),
  price: z.coerce.number().nonnegative("Must be ≥ 0"),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  product: DrinkProduct | null;
  beanTypes: string[];
  onClose: () => void;
}

export default function DrinkProductDialog({ product, beanTypes, onClose }: Props) {
  const [pending, startTransition] = useTransition();
  const [isCoffee, setIsCoffee] = useState(
    product ? product.bean_type_used !== null : true
  );

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      category: product?.category ?? "Coffee",
      is_coffee: product ? product.bean_type_used !== null : true,
      bean_type_used: product?.bean_type_used ?? beanTypes[0] ?? "",
      grams_per_serving: product?.grams_per_serving ?? 18,
      price: product?.price ?? 0,
      active: product?.active ?? true,
    },
  });

  function onSubmit(data: FormData) {
    if (data.is_coffee && !data.bean_type_used) {
      toast.error("Please choose which beans this drink uses");
      return;
    }
    if (data.is_coffee && (!data.grams_per_serving || data.grams_per_serving <= 0)) {
      toast.error("Please enter how many grams per cup");
      return;
    }
    startTransition(async () => {
      try {
        await upsertDrinkProduct({
          id: product?.id,
          name: data.name,
          category: data.category,
          bean_type_used: data.is_coffee ? (data.bean_type_used ?? null) : null,
          grams_per_serving: data.is_coffee ? (data.grams_per_serving ?? null) : null,
          price: data.price,
          active: data.active,
        });
        toast.success(product ? "Changes saved" : "Product added");
        onClose();
      } catch (e: any) {
        toast.error('Something went wrong. Please try again.');
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Drink" : "New Drink Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...register("name")} placeholder="e.g. Americano, Lemonade" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input {...register("category")} placeholder="e.g. Coffee, Cold Drinks" />
          </div>

          {/* Coffee toggle */}
          <div className="rounded-lg border border-stone-200 p-3 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                {...register("is_coffee")}
                checked={isCoffee}
                onChange={(e) => setIsCoffee(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-stone-800">Uses coffee beans</span>
            </label>

            {isCoffee && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label>Bean Type</Label>
                  {beanTypes.length > 0 ? (
                    <select
                      {...register("bean_type_used")}
                      className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm bg-white"
                    >
                      {beanTypes.map((bt) => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      {...register("bean_type_used")}
                      placeholder="Record a batch first"
                      className="border-amber-300 bg-amber-50 text-sm"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Grams / serving</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    {...register("grams_per_serving")}
                  />
                </div>
              </div>
            )}

            {!isCoffee && (
              <p className="text-xs text-stone-400">
                No bean stock will be deducted when this drink is sold.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Price (Rs.)</Label>
            <Input type="number" step="0.01" min="0" {...register("price")} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" {...register("active")} className="rounded" />
            <Label htmlFor="active" className="cursor-pointer">Active (available for sale)</Label>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
