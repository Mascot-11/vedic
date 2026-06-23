"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BeanBatch } from "@/lib/types";
import { allocateBatch } from "@/app/actions/inventory";

interface Props {
  batch: BeanBatch;
  onClose: () => void;
}

export default function AllocateDialog({ batch, onClose }: Props) {
  const [pool, setPool] = useState<"brewing" | "retail">("brewing");
  const [qty, setQty] = useState(0);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (qty <= 0) {
      toast.error("Enter a positive quantity.");
      return;
    }
    startTransition(async () => {
      try {
        await allocateBatch({ from_batch_id: batch.id, to_pool: pool, qty_grams: qty });
        toast.success(`${qty}g allocated to ${pool} stock`);
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
          <DialogTitle>Allocate Batch</DialogTitle>
          <DialogDescription>
            {batch.bean_type} — {batch.supplier} ({Number(batch.qty_received_grams).toLocaleString()}g received)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Pool</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={pool === "brewing" ? "default" : "outline"}
                onClick={() => setPool("brewing")}
                className="flex-1"
              >
                Brewing
              </Button>
              <Button
                type="button"
                variant={pool === "retail" ? "default" : "outline"}
                onClick={() => setPool("retail")}
                className="flex-1"
              >
                Retail
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Quantity (grams)</Label>
            <Input
              type="number"
              value={qty || ""}
              onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
              placeholder="e.g. 5000"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Allocating…" : "Allocate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
