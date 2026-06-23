import { openDB, DBSchema, IDBPDatabase } from "idb";

export type QueuedMutationType =
  | "add_order_item"
  | "remove_order_item"
  | "close_order_paid"
  | "close_order_credit"
  | "open_order";

export interface QueuedMutation {
  id: string;           // local UUID
  type: QueuedMutationType;
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
}

interface VedicDB extends DBSchema {
  mutation_queue: {
    key: string;
    value: QueuedMutation;
    indexes: { by_created: number };
  };
  // Local order state for offline order-taking
  local_orders: {
    key: string;  // order id
    value: {
      id: string;
      table_id: string;
      table_label: string;
      items: LocalOrderItem[];
      opened_at: number;
      synced: boolean;
    };
  };
}

export interface LocalOrderItem {
  local_id: string;
  product_id: string;
  product_name: string;
  product_type: "drink" | "simple";
  qty: number;
  unit_price: number;
  subtotal: number;
}

let dbPromise: Promise<IDBPDatabase<VedicDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<VedicDB>("vedic-coffee", 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const mqStore = db.createObjectStore("mutation_queue", { keyPath: "id" });
          mqStore.createIndex("by_created", "createdAt");
          db.createObjectStore("local_orders", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

// ── Mutation queue ──────────────────────────────────────────

export async function enqueue(
  type: QueuedMutationType,
  payload: Record<string, unknown>
): Promise<string> {
  const db = await getDB();
  const id = crypto.randomUUID();
  await db.add("mutation_queue", { id, type, payload, createdAt: Date.now(), attempts: 0 });
  return id;
}

export async function dequeue(id: string) {
  const db = await getDB();
  await db.delete("mutation_queue", id);
}

export async function getPendingMutations(): Promise<QueuedMutation[]> {
  const db = await getDB();
  return db.getAllFromIndex("mutation_queue", "by_created");
}

export async function incrementAttempts(id: string) {
  const db = await getDB();
  const item = await db.get("mutation_queue", id);
  if (item) await db.put("mutation_queue", { ...item, attempts: item.attempts + 1 });
}

export async function queueSize(): Promise<number> {
  const db = await getDB();
  return db.count("mutation_queue");
}

// ── Local order state (for offline tab-keeping) ─────────────

export async function saveLocalOrder(order: VedicDB["local_orders"]["value"]) {
  const db = await getDB();
  await db.put("local_orders", order);
}

export async function getLocalOrder(id: string) {
  const db = await getDB();
  return db.get("local_orders", id);
}

export async function deleteLocalOrder(id: string) {
  const db = await getDB();
  await db.delete("local_orders", id);
}

export async function getAllLocalOrders() {
  const db = await getDB();
  return db.getAll("local_orders");
}
