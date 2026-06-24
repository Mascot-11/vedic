"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Bean, CreditCard, ClipboardList,
  BarChart3, Settings, UserCircle, WifiOff,
} from "lucide-react";
import { User, Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useOffline } from "@/components/offline-provider";

interface NavItem { href: string; label: string; icon: React.ElementType; roles: Role[]; }

const allNav: NavItem[] = [
  { href: "/",          label: "Tables",    icon: LayoutGrid,    roles: ["superadmin","owner","staff"] },
  { href: "/inventory", label: "Inventory", icon: Bean,          roles: ["superadmin","owner","staff"] },
  { href: "/credit",    label: "Credit",    icon: CreditCard,    roles: ["superadmin","owner","staff"] },
  { href: "/orders",    label: "Orders",    icon: ClipboardList, roles: ["superadmin","owner"] },
  { href: "/reports",   label: "Reports",   icon: BarChart3,     roles: ["superadmin","owner"] },
  { href: "/settings",  label: "Settings",  icon: Settings,      roles: ["superadmin","owner"] },
  { href: "/account",   label: "Account",   icon: UserCircle,    roles: ["superadmin","owner","staff"] },
];

export default function BottomNav({ user }: { user: User }) {
  const pathname = usePathname();
  const { isOnline, pendingCount } = useOffline();

  const visible = allNav.filter((i) => i.roles.includes(user.role));

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-stone-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch overflow-x-auto scrollbar-none">
        {visible.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 min-w-14 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors relative",
                active ? "text-stone-900" : "text-stone-400"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-5.5 w-5.5", active ? "text-stone-900" : "text-stone-400")} />
                {item.href === "/account" && (!isOnline || pendingCount > 0) && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
                )}
              </div>
              <span className="leading-none">{item.label}</span>
              {active && (
                <span className="absolute top-0 inset-x-0 h-0.5 rounded-full bg-stone-900" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
