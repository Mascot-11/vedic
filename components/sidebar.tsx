"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid, Coffee, Bean, CreditCard,
  BarChart3, Users, Settings, LogOut, UserCircle,
  WifiOff, RefreshCw,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { User, Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useOffline } from "@/components/offline-provider";

interface NavItem { href: string; label: string; icon: React.ElementType; roles: Role[]; }

const navItems: NavItem[] = [
  { href: "/",          label: "Tables",      icon: LayoutGrid,  roles: ["superadmin","owner","staff"] },
  { href: "/products",  label: "Products",    icon: Coffee,      roles: ["superadmin","owner"] },
  { href: "/inventory", label: "Inventory",   icon: Bean,        roles: ["superadmin","owner","staff"] },
  { href: "/credit",    label: "Credit",      icon: CreditCard,  roles: ["superadmin","owner","staff"] },
  { href: "/reports",   label: "Reports",     icon: BarChart3,   roles: ["superadmin","owner"] },
  { href: "/users",     label: "Users",       icon: Users,       roles: ["superadmin","owner"] },
  { href: "/settings",  label: "Settings",    icon: Settings,    roles: ["superadmin","owner"] },
  { href: "/account",   label: "My Account",  icon: UserCircle,  roles: ["superadmin","owner","staff"] },
];

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isOnline, syncStatus, pendingCount, flush } = useOffline();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  const visible = navItems.filter((i) => i.roles.includes(user.role));

  return (
    <aside className="w-16 md:w-52 flex flex-col shrink-0 bg-[--sidebar] text-[--sidebar-foreground] min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[--sidebar-border]">
        <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
          <Coffee className="h-4 w-4 text-white" />
        </div>
        <div className="hidden md:block min-w-0">
          <p className="font-semibold text-sm text-white leading-tight">Vedic Coffee</p>
          <p className="text-[11px] capitalize" style={{ color: "oklch(0.65 0.01 55)" }}>{user.role}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 space-y-0.5 px-2">
        {visible.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-[--sidebar-primary] text-[--sidebar-primary-foreground]"
                  : "text-[oklch(0.65_0.01_55)] hover:bg-[--sidebar-accent] hover:text-white"
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" style={{ width: 18, height: 18 }} />
              <span className="hidden md:block truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Offline pill */}
      {(!isOnline || pendingCount > 0) && (
        <div className="mx-2 mb-2">
          {!isOnline ? (
            <div className="flex items-center gap-2 rounded-lg bg-red-900/50 px-3 py-2 text-xs text-red-300">
              <WifiOff className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:block">Offline</span>
            </div>
          ) : (
            <button
              onClick={flush}
              className="w-full flex items-center gap-2 rounded-lg bg-amber-900/40 px-3 py-2 text-xs text-amber-300 hover:bg-amber-900/60 transition-colors"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 shrink-0", syncStatus === "syncing" && "animate-spin")} />
              <span className="hidden md:block">
                {syncStatus === "syncing" ? "Syncing…" : `${pendingCount} pending`}
              </span>
            </button>
          )}
        </div>
      )}

      {/* User + logout */}
      <div className="border-t border-[--sidebar-border] px-2 py-3 space-y-0.5">
        <div className="hidden md:block px-3 py-1">
          <p className="text-xs font-medium text-white truncate">{user.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{ color: "oklch(0.55 0.01 55)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.55 0.01 55)")}
        >
          <LogOut style={{ width: 18, height: 18 }} className="shrink-0" />
          <span className="hidden md:block">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
