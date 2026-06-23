"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { flushQueue, onSyncStatus, SyncStatus } from "@/lib/sync-engine";
import { queueSize } from "@/lib/offline-queue";

interface OfflineCtx {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  flush: () => void;
}

const Ctx = createContext<OfflineCtx>({
  isOnline: true,
  syncStatus: "idle",
  pendingCount: 0,
  flush: () => {},
});

export function useOffline() {
  return useContext(Ctx);
}

export default function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Poll queue size
    async function updateCount() {
      const n = await queueSize();
      setPendingCount(n);
    }
    updateCount();
    const timer = setInterval(updateCount, 3000);

    const goOnline = () => { setIsOnline(true); flushQueue(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    const unsub = onSyncStatus((status, pending) => {
      setSyncStatus(status);
      setPendingCount(pending);
    });

    return () => {
      clearInterval(timer);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      unsub();
    };
  }, []);

  return (
    <Ctx.Provider value={{ isOnline, syncStatus, pendingCount, flush: flushQueue }}>
      {children}
    </Ctx.Provider>
  );
}
