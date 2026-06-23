import {
  getPendingMutations,
  dequeue,
  incrementAttempts,
  queueSize,
  QueuedMutation,
} from "./offline-queue";
import {
  addItemToOrder,
  removeOrderItem,
  closeOrderAsPaid,
  closeOrderAsCredit,
  openOrder,
} from "@/app/actions/orders";

export type SyncStatus = "idle" | "syncing" | "error";

type SyncListener = (status: SyncStatus, pending: number) => void;
const listeners = new Set<SyncListener>();

export function onSyncStatus(fn: SyncListener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(status: SyncStatus, pending: number) {
  listeners.forEach((fn) => fn(status, pending));
}

async function replayMutation(m: QueuedMutation): Promise<boolean> {
  try {
    const p = m.payload as any;
    switch (m.type) {
      case "open_order":
        await openOrder(p.tableId);
        break;
      case "add_order_item":
        await addItemToOrder(p.orderId, p.productId, p.productType, p.qty);
        break;
      case "remove_order_item":
        await removeOrderItem(p.orderId, p.itemId);
        break;
      case "close_order_paid":
        await closeOrderAsPaid(p.orderId, p.discountAmount, p.discountReason);
        break;
      case "close_order_credit":
        await closeOrderAsCredit(
          p.orderId, p.customerId, p.amountPaid, p.discountAmount, p.discountReason
        );
        break;
    }
    return true;
  } catch {
    return false;
  }
}

let syncing = false;

export async function flushQueue() {
  if (syncing) return;
  const size = await queueSize();
  if (size === 0) return;

  syncing = true;
  emit("syncing", size);

  const mutations = await getPendingMutations();
  let remaining = mutations.length;

  for (const m of mutations) {
    const ok = await replayMutation(m);
    if (ok) {
      await dequeue(m.id);
      remaining--;
    } else {
      await incrementAttempts(m.id);
      // Stop on first failure to preserve ordering
      break;
    }
  }

  syncing = false;
  emit(remaining === 0 ? "idle" : "error", remaining);
}

// Auto-flush when browser comes back online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    flushQueue();
  });
}
