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
import { addBeanBatch } from "@/app/actions/inventory";

const schema = z.object({
  bean_type: z.string().min(1),
  supplier: z.string().min(1),
  roast_date: z.string().min(1),
  cost_per_kg: z.coerce.number().nonnegative(),
  qty_received_grams: z.coerce.number().positive(),
});

type FormData = z.infer<typeof schema>;

export default function AddBatchDialog({ onClose }: { onClose: () => void }) {
  const [pending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: {
      bean_type: "",
      supplier: "",
      roast_date: new Date().toISOString().split("T")[0],
      cost_per_kg: 0,
      qty_received_grams: 0,
    },
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        await addBeanBatch(data);
        toast.success("Batch recorded");
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
          <DialogTitle>Record Bean Batch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Bean Type</Label>
              <Input {...register("bean_type")} placeholder="e.g. Arabica" />
            </div>
            <div className="space-y-1.5">
              <Label>Supplier</Label>
              <Input {...register("supplier")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Roast Date</Label>
              <Input type="date" {...register("roast_date")} />
            </div>
            <div className="space-y-1.5">
              <Label>Cost per kg (Rs.)</Label>
              <Input type="number" step="0.01" {...register("cost_per_kg")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Quantity Received (grams)</Label>
            <Input type="number" {...register("qty_received_grams")} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save Batch"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
