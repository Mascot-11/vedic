"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coffee,
  LayoutGrid,
  Users,
  BarChart3,
  Settings,
  LogOut,
  CreditCard,
  Bean,
  UserCircle,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { User, Role } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Tables",
    icon: LayoutGrid,
    roles: ["superadmin", "owner", "staff"],
  },
  {
    href: "/products",
    label: "Products",
    icon: Coffee,
    roles: ["superadmin", "owner"],
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: Bean,
    roles: ["superadmin", "owner", "staff"],
  },
  {
    href: "/credit",
    label: "Credit & Dues",
    icon: CreditCard,
    roles: ["superadmin", "owner", "staff"],
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["superadmin", "owner"],
  },
  {
    href: "/users",
    label: "Users",
    icon: Users,
    roles: ["superadmin", "owner"],
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    roles: ["superadmin", "owner"],
  },
  {
    href: "/account",
    label: "My Account",
    icon: UserCircle,
    roles: ["superadmin", "owner", "staff"],
  },
];

interface SidebarProps {
  user: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const visible = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="w-56 flex flex-col bg-stone-900 text-stone-100 min-h-screen">
      <div className="px-4 py-5 border-b border-stone-700">
        <p className="font-bold text-base text-white">Vedic Coffee</p>
        <p className="text-xs text-stone-400 mt-0.5 capitalize">{user.role}</p>
      </div>

      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {visible.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-stone-700 text-white"
                  : "text-stone-400 hover:bg-stone-800 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-700 px-2 py-3 space-y-0.5">
        <div className="px-3 py-1.5">
          <p className="text-xs font-medium text-stone-300 truncate">{user.name}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
