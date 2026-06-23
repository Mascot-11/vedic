import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-stone-50 text-center px-4">
      <WifiOff className="h-12 w-12 text-stone-300" />
      <h1 className="text-xl font-bold text-stone-800">You're offline</h1>
      <p className="text-stone-500 text-sm max-w-xs">
        No internet connection. Any items you add to orders will be queued and synced automatically when you reconnect.
      </p>
    </div>
  );
}
