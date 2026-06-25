"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SimpleProduct } from "@/lib/types";
import { upsertSimpleProduct } from "@/app/actions/products";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1),
  usage_type: z.enum(["sale", "cafe_use"]),
  cost_price: z.coerce.number().nonnegative(),
  selling_price: z.coerce.number().nonnegative(),
  low_stock_threshold: z.coerce.number().int().nonnegative(),
  qty_available: z.coerce.number().int().nonnegative(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  product: SimpleProduct | null;
  onClose: () => void;
}

export default function SimpleProductDialog({ product, onClose }: Props) {
  const [pending, startTransition] = useTransition();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: product
      ? { ...product }
      : {
          name: "",
          category: "Snacks",
          usage_type: "sale",
          cost_price: 0,
          selling_price: 0,
          low_stock_threshold: 5,
          qty_available: 0,
        },
  });

  const usageType = watch("usage_type");

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        await upsertSimpleProduct({ ...data, id: product?.id });
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
          <DialogTitle>{product ? "Edit Item" : "New Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...register("name")} placeholder="e.g. Brownie, Cigarette, Lime Juice" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm transition-colors ${usageType === "sale" ? "border-stone-900 bg-stone-50 font-medium" : "border-stone-200"}`}>
                <input type="radio" value="sale" {...register("usage_type")} className="sr-only" />
                <span>For Sale</span>
              </label>
              <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm transition-colors ${usageType === "cafe_use" ? "border-stone-900 bg-stone-50 font-medium" : "border-stone-200"}`}>
                <input type="radio" value="cafe_use" {...register("usage_type")} className="sr-only" />
                <span>Cafe Use Only</span>
              </label>
            </div>
            {usageType === "cafe_use" && (
              <p className="text-xs text-stone-400">
                Tracked for internal use (e.g. cigarettes, syrups). Not shown to customers.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input
              {...register("category")}
              placeholder={usageType === "cafe_use" ? "e.g. Tobacco, Syrups" : "e.g. Snacks, Pastries"}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cost Price (Rs.)</Label>
              <Input type="number" step="0.01" {...register("cost_price")} />
            </div>
            {usageType === "sale" && (
              <div className="space-y-1.5">
                <Label>Selling Price (Rs.)</Label>
                <Input type="number" step="0.01" {...register("selling_price")} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Low Stock Alert</Label>
              <Input type="number" {...register("low_stock_threshold")} />
            </div>
            <div className="space-y-1.5">
              <Label>{product ? "Stock in Hand" : "Initial Stock"}</Label>
              <Input type="number" min="0" {...register("qty_available")} />
              {errors.qty_available && <p className="text-xs text-red-500">{errors.qty_available.message}</p>}
            </div>
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
