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
      <div className="flex min-h-screen bg-stone-50">
        {/* Sidebar: desktop only */}
        <div className="hidden md:flex md:shrink-0">
          <Sidebar user={user} />
        </div>
        {/* Main: safe bottom padding on mobile for nav bar */}
        <main className="flex-1 min-w-0 overflow-x-hidden flex flex-col" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 4rem)" }}>
          <div className="flex-1 w-full max-w-full md:pb-0">
            {children}
          </div>
          <footer className="hidden md:block px-6 py-3 text-center">
            <p className="text-[11px] text-stone-300">
              Developed by{" "}
              <a
                href="https://www.shreeyushdhungana.com.np/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-stone-500 transition-colors underline underline-offset-2"
              >
                Shreeyush Dhungana
              </a>
            </p>
          </footer>
        </main>
      </div>
      {/* Bottom nav: mobile only */}
      <div className="md:hidden">
        <BottomNav user={user} />
      </div>
    </OfflineProvider>
  );
}
