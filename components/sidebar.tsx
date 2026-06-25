"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  LayoutGrid, Coffee, Bean, CreditCard,
  BarChart3, Users, Settings, LogOut, UserCircle,
  WifiOff, RefreshCw, ClipboardList, Loader2, Package,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { User, Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useOffline } from "@/components/offline-provider";

interface NavItem { href: string; label: string; icon: React.ElementType; roles: Role[]; }

const navItems: NavItem[] = [
  { href: "/",          label: "Tables",    icon: LayoutGrid,    roles: ["superadmin","owner","staff"] },
  { href: "/inventory", label: "Inventory", icon: Bean,          roles: ["superadmin","owner","staff"] },
  { href: "/credit",    label: "Credit",    icon: CreditCard,    roles: ["superadmin","owner","staff"] },
  { href: "/products",  label: "Products",  icon: Package,       roles: ["superadmin","owner"] },
  { href: "/orders",    label: "Orders",    icon: ClipboardList, roles: ["superadmin","owner"] },
  { href: "/reports",   label: "Reports",   icon: BarChart3,     roles: ["superadmin","owner"] },
  { href: "/users",     label: "Users",     icon: Users,         roles: ["superadmin","owner"] },
  { href: "/settings",  label: "Settings",  icon: Settings,      roles: ["superadmin","owner"] },
  { href: "/account",   label: "My Account",icon: UserCircle,    roles: ["superadmin","owner","staff"] },
];

// Sidebar palette — deep coffee brown with amber highlights
const BG        = "#1a0f00";         // very dark espresso
const BG_HOVER  = "#2c1a08";         // slightly lighter on hover
const BG_ACTIVE = "#3d2510";         // warm brown for active
const BORDER    = "#2e1c09";
const ACCENT    = "#e8a020";         // warm amber
const TEXT_DIM  = "#7a5c3a";         // muted brown-tan
const TEXT_MID  = "#c49060";         // medium warm
const TEXT_ON   = "#fff8f0";         // off-white warm

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isOnline, syncStatus, pendingCount, flush } = useOffline();
  const [loggingOut, startLogout] = useTransition();
  const visible = navItems.filter((i) => i.roles.includes(user.role));

  function handleLogout() {
    startLogout(async () => {
      await logout();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <aside
      className="w-16 md:w-56 flex flex-col shrink-0 min-h-screen"
      style={{ background: BG, borderRight: `1px solid ${BORDER}` }}
    >
      {/* Logo / brand */}
      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
          <img src="/logo.svg" alt="Vedic" className="h-full w-full object-cover" />
        </div>
        <div className="hidden md:block overflow-hidden">
          <p className="text-sm font-bold leading-tight truncate" style={{ color: TEXT_ON }}>
            Vedic Coffee
          </p>
          <p className="text-[11px] font-medium capitalize truncate" style={{ color: TEXT_DIM }}>
            {user.role}
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {visible.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150"
              style={{
                background: active ? BG_ACTIVE : "transparent",
                color: active ? TEXT_ON : TEXT_MID,
                borderLeft: active ? `3px solid ${ACCENT}` : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = BG_HOVER;
                  (e.currentTarget as HTMLElement).style.color = TEXT_ON;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = TEXT_MID;
                }
              }}
            >
              <item.icon
                className="shrink-0"
                style={{ width: 17, height: 17, color: active ? ACCENT : "inherit" }}
              />
              <span className="hidden md:block truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Offline / sync indicator */}
      {(!isOnline || pendingCount > 0) && (
        <div className="mx-2 mb-2">
          {!isOnline ? (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs"
              style={{ background: "#3d0a0a", color: "#f87171" }}
            >
              <WifiOff className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:block font-medium">No internet</span>
            </div>
          ) : (
            <button
              onClick={flush}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs transition-colors"
              style={{ background: "#2c1e00", color: ACCENT }}
            >
              <RefreshCw className={cn("h-3.5 w-3.5 shrink-0", syncStatus === "syncing" && "animate-spin")} />
              <span className="hidden md:block font-medium">
                {syncStatus === "syncing" ? "Saving…" : `${pendingCount} unsaved`}
              </span>
            </button>
          )}
        </div>
      )}

      {/* User row + sign out */}
      <div className="px-2 pb-3 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="hidden md:flex items-center gap-2.5 px-3 py-2 mb-1">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: ACCENT, color: "#1a0f00" }}
          >
            {user.name[0]?.toUpperCase()}
          </div>
          <p className="text-[13px] font-semibold truncate" style={{ color: TEXT_ON }}>
            {user.name}
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Sign out"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all disabled:opacity-50"
          style={{ color: TEXT_DIM }}
          onMouseEnter={(e) => {
            if (!loggingOut) {
              (e.currentTarget as HTMLElement).style.background = BG_HOVER;
              (e.currentTarget as HTMLElement).style.color = TEXT_ON;
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = TEXT_DIM;
          }}
        >
          {loggingOut
            ? <Loader2 style={{ width: 17, height: 17 }} className="shrink-0 animate-spin" />
            : <LogOut style={{ width: 17, height: 17 }} className="shrink-0" />}
          <span className="hidden md:block">
            {loggingOut ? "Signing out…" : "Sign out"}
          </span>
        </button>
      </div>
    </aside>
  );
}
