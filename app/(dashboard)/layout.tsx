import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import OfflineProvider from "@/components/offline-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    redirect("/login");
  }

  if (!user) redirect("/login");
  if (!user.active) redirect("/login");

  return (
    <OfflineProvider>
      <div className="flex h-full min-h-screen bg-stone-50">
        <Sidebar user={user} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </OfflineProvider>
  );
}
