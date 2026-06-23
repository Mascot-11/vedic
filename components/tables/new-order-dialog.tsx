"use client";

import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, User } from "@/lib/types";
import { openOrder } from "@/app/actions/orders";

interface NewOrderDialogProps {
  table: Table;
  user: User;
  onClose: () => void;
}

export default function NewOrderDialog({ table, onClose }: NewOrderDialogProps) {
  const [pending, startTransition] = useTransition();

  function handleOpen() {
    startTransition(async () => {
      await openOrder(table.id);
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Open tab for {table.label}</DialogTitle>
          <DialogDescription>
            This will start a new order for {table.label}. You can add items after opening.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleOpen} disabled={pending}>
            {pending ? "Opening…" : "Open Tab"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
