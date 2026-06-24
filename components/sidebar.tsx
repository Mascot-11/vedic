"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid, Coffee, Bean, CreditCard,
  BarChart3, Users, Settings, LogOut, UserCircle,
  WifiOff, RefreshCw, ClipboardList,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { User, Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useOffline } from "@/components/offline-provider";

interface NavItem { href: string; label: string; icon: React.ElementType; roles: Role[]; }

const navItems: NavItem[] = [
  { href: "/",          label: "Tables",     icon: LayoutGrid,  roles: ["superadmin","owner","staff"] },
  { href: "/products",  label: "Products",   icon: Coffee,      roles: ["superadmin","owner"] },
  { href: "/inventory", label: "Inventory",  icon: Bean,        roles: ["superadmin","owner","staff"] },
  { href: "/credit",    label: "Credit",     icon: CreditCard,  roles: ["superadmin","owner","staff"] },
  { href: "/orders",    label: "Orders",     icon: ClipboardList, roles: ["superadmin","owner"] },
  { href: "/reports",   label: "Reports",    icon: BarChart3,   roles: ["superadmin","owner"] },
  { href: "/users",     label: "Users",      icon: Users,       roles: ["superadmin","owner"] },
  { href: "/settings",  label: "Settings",   icon: Settings,    roles: ["superadmin","owner"] },
  { href: "/account",   label: "My Account", icon: UserCircle,  roles: ["superadmin","owner","staff"] },
];

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isOnline, syncStatus, pendingCount, flush } = useOffline();
  const visible = navItems.filter((i) => i.roles.includes(user.role));

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className="w-16 md:w-56 flex flex-col shrink-0 min-h-screen"
      style={{ background: "oklch(0.14 0.018 48)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: "1px solid oklch(0.22 0.014 48)" }}>
        <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 bg-stone-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Vedic" className="h-full w-full object-cover" />
        </div>
        <div className="hidden md:block overflow-hidden">
          <p className="text-sm font-bold text-white leading-tight truncate">Vedic Coffee</p>
          <p className="text-[11px] font-medium capitalize truncate"
            style={{ color: "oklch(0.5 0.012 55)" }}>{user.role}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {visible.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150",
                active
                  ? "text-white"
                  : "hover:text-white"
              )}
              style={active
                ? { background: "oklch(0.22 0.016 48)", color: "white" }
                : { color: "oklch(0.52 0.01 55)" }
              }
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "oklch(0.19 0.015 48)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "";
              }}
            >
              <item.icon
                className="shrink-0 transition-colors"
                style={{ width: 17, height: 17 }}
              />
              <span className="hidden md:block truncate">{item.label}</span>
              {active && (
                <div className="hidden md:block ml-auto h-1.5 w-1.5 rounded-full"
                  style={{ background: "oklch(0.72 0.14 58)" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Offline pill */}
      {(!isOnline || pendingCount > 0) && (
        <div className="mx-2 mb-2">
          {!isOnline ? (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs"
              style={{ background: "oklch(0.2 0.08 25)", color: "oklch(0.75 0.15 25)" }}>
              <WifiOff className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:block font-medium">Offline</span>
            </div>
          ) : (
            <button
              onClick={flush}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs transition-colors"
              style={{ background: "oklch(0.22 0.06 60)", color: "oklch(0.78 0.12 60)" }}
            >
              <RefreshCw className={cn("h-3.5 w-3.5 shrink-0", syncStatus === "syncing" && "animate-spin")} />
              <span className="hidden md:block font-medium">
                {syncStatus === "syncing" ? "Syncing…" : `${pendingCount} pending`}
              </span>
            </button>
          )}
        </div>
      )}

      {/* User row */}
      <div className="px-2 pb-3 pt-2" style={{ borderTop: "1px solid oklch(0.22 0.014 48)" }}>
        <div className="hidden md:flex items-center gap-2.5 px-3 py-2 mb-0.5">
          <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "oklch(0.72 0.14 58)" }}>
            {user.name[0]?.toUpperCase()}
          </div>
          <p className="text-[13px] font-medium text-white truncate">{user.name}</p>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all"
          style={{ color: "oklch(0.44 0.01 55)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "oklch(0.19 0.015 48)";
            (e.currentTarget as HTMLElement).style.color = "white";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "";
            (e.currentTarget as HTMLElement).style.color = "oklch(0.44 0.01 55)";
          }}
        >
          <LogOut style={{ width: 17, height: 17 }} className="shrink-0" />
          <span className="hidden md:block">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
