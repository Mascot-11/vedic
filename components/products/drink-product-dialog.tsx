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
import { DrinkProduct } from "@/lib/types";
import { upsertDrinkProduct } from "@/app/actions/products";

const schema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  bean_type_used: z.string().min(1),
  grams_per_serving: z.coerce.number().positive(),
  price: z.coerce.number().nonnegative(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  product: DrinkProduct | null;
  onClose: () => void;
}

export default function DrinkProductDialog({ product, onClose }: Props) {
  const [pending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: product ?? {
      name: "",
      category: "",
      bean_type_used: "",
      grams_per_serving: 18,
      price: 0,
      active: true,
    },
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        await upsertDrinkProduct({ ...data, id: product?.id });
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
          <DialogTitle>{product ? "Edit Drink" : "New Drink Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input {...register("category")} placeholder="e.g. Espresso" />
            </div>
            <div className="space-y-1.5">
              <Label>Bean Type</Label>
              <Input {...register("bean_type_used")} placeholder="e.g. Arabica" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Grams / serving</Label>
              <Input type="number" step="0.1" {...register("grams_per_serving")} />
            </div>
            <div className="space-y-1.5">
              <Label>Price (Rs.)</Label>
              <Input type="number" step="0.01" {...register("price")} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" {...register("active")} />
            <Label htmlFor="active">Active (available for sale)</Label>
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
