"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Bean, CreditCard, MoreHorizontal } from "lucide-react";
import { User, Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useOffline } from "@/components/offline-provider";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const primaryNav: NavItem[] = [
  { href: "/",          label: "Tables",    icon: LayoutGrid, roles: ["superadmin","owner","staff"] },
  { href: "/inventory", label: "Inventory", icon: Bean,       roles: ["superadmin","owner","staff"] },
  { href: "/credit",    label: "Credit",    icon: CreditCard, roles: ["superadmin","owner","staff"] },
];

export default function BottomNav({ user }: { user: User }) {
  const pathname = usePathname();
  const { isOnline, pendingCount } = useOffline();

  const visible = primaryNav.filter((i) => i.roles.includes(user.role));

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-stone-200 safe-area-inset-bottom">
      <div className="flex items-stretch" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {visible.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold transition-colors",
                active ? "text-stone-900" : "text-stone-400"
              )}
            >
              <item.icon className={cn("h-5 w-5", active ? "text-stone-900" : "text-stone-400")} />
              {item.label}
              {active && <div className="h-0.5 w-4 rounded-full bg-stone-900 absolute bottom-1" />}
            </Link>
          );
        })}

        {/* More menu item */}
        <Link
          href="/account"
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold transition-colors relative",
            pathname === "/account" ? "text-stone-900" : "text-stone-400"
          )}
        >
          <div className="relative">
            <MoreHorizontal className="h-5 w-5" />
            {(!isOnline || pendingCount > 0) && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </div>
          More
        </Link>
      </div>
    </nav>
  );
}
