"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createBatch } from "@/app/actions/inventory";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    bean_type: z.string().min(1, "Bean type is required"),
    total_grams: z.coerce.number().positive("Total must be greater than 0"),
    brewing_grams: z.coerce.number().min(0, "Cannot be negative"),
    retail_grams: z.coerce.number().min(0, "Cannot be negative"),
  })
  .refine(
    (d) => d.brewing_grams + d.retail_grams > 0,
    { message: "Allocate at least some grams to brewing or retail", path: ["brewing_grams"] }
  )
  .refine(
    (d) => d.brewing_grams + d.retail_grams <= d.total_grams,
    { message: "Allocated grams exceed the batch total", path: ["brewing_grams"] }
  );

type FormData = z.infer<typeof schema>;

export default function AddBatchDialog({ onClose }: { onClose: () => void }) {
  const [pending, startTransition] = useTransition();

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { bean_type: "", total_grams: 0, brewing_grams: 0, retail_grams: 0 },
  });

  const [total, brewing, retail] = useWatch({
    control,
    name: ["total_grams", "brewing_grams", "retail_grams"],
  });

  const totalN = Number(total) || 0;
  const brewingN = Number(brewing) || 0;
  const retailN = Number(retail) || 0;
  const allocated = brewingN + retailN;
  const remaining = totalN - allocated;
  const overAllocated = allocated > totalN && totalN > 0;

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        await createBatch({
          bean_type: data.bean_type,
          total_grams: data.total_grams,
          brewing_grams: data.brewing_grams,
          retail_grams: data.retail_grams,
        });
        toast.success("Batch created and allocated");
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
            Enter the total quantity and split it between cafe brewing and retail selling.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          {/* Bean type */}
          <div className="space-y-1.5">
            <Label>Bean Type</Label>
            <Input {...register("bean_type")} placeholder="e.g. Arabica, House Blend" />
            {errors.bean_type && <p className="text-xs text-red-500">{errors.bean_type.message}</p>}
          </div>

          {/* Total quantity */}
          <div className="space-y-1.5">
            <Label>Total Quantity (grams)</Label>
            <Input
              type="number"
              step="1"
              min="1"
              {...register("total_grams")}
              placeholder="e.g. 5000"
            />
            {errors.total_grams && <p className="text-xs text-red-500">{errors.total_grams.message}</p>}
          </div>

          {/* Allocation split */}
          <div className="rounded-xl border border-stone-200 p-4 space-y-3 bg-stone-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Allocate grams
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cafe Brewing</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    {...register("brewing_grams")}
                    placeholder="0"
                    className="pr-6"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">g</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Retail / Selling</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    {...register("retail_grams")}
                    placeholder="0"
                    className="pr-6"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">g</span>
                </div>
              </div>
            </div>

            {/* Live gram bar */}
            {totalN > 0 && (
              <div className="space-y-1.5">
                <div className="h-2 rounded-full bg-stone-200 overflow-hidden flex">
                  <div
                    className="bg-amber-500 transition-all duration-150"
                    style={{ width: `${Math.min(100, (brewingN / totalN) * 100)}%` }}
                  />
                  <div
                    className="bg-stone-700 transition-all duration-150"
                    style={{ width: `${Math.min(100, (retailN / totalN) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-amber-600">Brewing: {brewingN.toLocaleString()}g</span>
                  <span className="text-stone-500">Retail: {retailN.toLocaleString()}g</span>
                </div>
                <p className={cn(
                  "text-xs font-medium text-center",
                  overAllocated ? "text-red-600" : remaining === 0 ? "text-green-600" : "text-stone-500"
                )}>
                  {overAllocated
                    ? `Over by ${(allocated - totalN).toLocaleString()}g`
                    : remaining === 0
                    ? "Fully allocated"
                    : `${remaining.toLocaleString()}g unallocated (stays in batch)`}
                </p>
              </div>
            )}

            {(errors.brewing_grams || errors.retail_grams) && (
              <p className="text-xs text-red-500">
                {errors.brewing_grams?.message || errors.retail_grams?.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || overAllocated}>
              {pending ? "Saving…" : "Create Batch"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
