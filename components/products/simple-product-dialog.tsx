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
  name: z.string().min(1),
  category: z.string().min(1),
  cost_price: z.coerce.number().nonnegative(),
  selling_price: z.coerce.number().nonnegative(),
  low_stock_threshold: z.coerce.number().int().nonnegative(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  product: SimpleProduct | null;
  onClose: () => void;
}

export default function SimpleProductDialog({ product, onClose }: Props) {
  const [pending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: product ?? {
      name: "",
      category: "Snacks",
      cost_price: 0,
      selling_price: 0,
      low_stock_threshold: 5,
    },
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        await upsertSimpleProduct({ ...data, id: product?.id });
        toast.success(product ? "Product updated" : "Product created");
        onClose();
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...register("name")} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input {...register("category")} placeholder="Snacks, Pastries…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cost Price (Rs.)</Label>
              <Input type="number" step="0.01" {...register("cost_price")} />
            </div>
            <div className="space-y-1.5">
              <Label>Selling Price (Rs.)</Label>
              <Input type="number" step="0.01" {...register("selling_price")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Low Stock Alert Below</Label>
            <Input type="number" {...register("low_stock_threshold")} />
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
