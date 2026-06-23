import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import BottomNav from "@/components/bottom-nav";
import OfflineProvider from "@/components/offline-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try { user = await getCurrentUser(); } catch { redirect("/login"); }
  if (!user) redirect("/login");
  if (!user.active) redirect("/login");

  return (
    <OfflineProvider>
      <div className="flex h-full min-h-screen bg-stone-50">
        {/* Sidebar: hidden on mobile, shown md+ */}
        <div className="hidden md:flex md:shrink-0">
          <Sidebar user={user} />
        </div>
        {/* Main content: add bottom padding on mobile for the bottom nav */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      {/* Bottom nav: only on mobile */}
      <BottomNav user={user} />
    </OfflineProvider>
  );
}
