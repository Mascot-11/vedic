"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createBatch } from "@/app/actions/inventory";

const schema = z.object({
  bean_type: z.string().min(1, "Bean type is required"),
  name:        z.string(),
  remarks:     z.string(),
  total_grams: z.coerce.number().positive("Quantity must be greater than 0"),
});

type FormData = z.infer<typeof schema>;

export default function AddBatchDialog({ onClose }: { onClose: () => void }) {
  const [pending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { bean_type: "", name: "", remarks: "", total_grams: 0 },
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        await createBatch({
          bean_type:   data.bean_type,
          name:        data.name,
          remarks:     data.remarks,
          total_grams: data.total_grams,
        });
        toast.success("Batch added to brewing stock");
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
          <DialogTitle>Add Bean Batch</DialogTitle>
          <DialogDescription>
            All grams go directly to brewing stock.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Input {...register("bean_type")} placeholder="e.g. Arabica" />
              {errors.bean_type && (
                <p className="text-xs text-red-500">{errors.bean_type.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Name <span className="text-stone-400 font-normal">(optional)</span></Label>
              <Input {...register("name")} placeholder="e.g. House Blend" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Quantity <span className="text-stone-500 font-normal">(grams)</span>
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="1"
                min="1"
                {...register("total_grams")}
                placeholder="e.g. 5000"
                className="pr-7"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">g</span>
            </div>
            {errors.total_grams && (
              <p className="text-xs text-red-500">{errors.total_grams.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Remarks <span className="text-stone-400 font-normal">(optional)</span></Label>
            <Textarea
              {...register("remarks")}
              placeholder="Any notes about this batch…"
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add Batch"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
