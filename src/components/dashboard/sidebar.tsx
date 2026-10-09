"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Sidebar({ userRole }: { userRole: "ADMIN" | "DJ" | "CLIENT" }) {
  const [collapsed, setCollapsed] = useState(false);
  const [
    items,
    setItems] = useState<
    Array<{ name: string; href: string; icon: string; roles: string[] }>
  >([
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "Layout",
      roles: ["ADMIN", "DJ", "CLIENT"],
    },
    {
      name: "Events",
      href: "/dashboard/events",
      icon: "Calendar",
      roles: ["ADMIN", "DJ"],
    },
    {
      name: "Clients",
      href: "/dashboard/clients",
      icon: "Users",
      roles: ["ADMIN"],
    },
    {
      name: "Venues",
      href: "/dashboard/venues",
      icon: "Building",
      roles: ["ADMIN", "DJ"],
    },
    {
      name: "Staff",
      href: "/dashboard/staff",
      icon: "Users",
      roles: ["ADMIN"],
    },
    {
      name: "Vendors",
      href: "/dashboard/vendors",
      icon: "Briefcase",
      roles: ["ADMIN"],
    },
    {
      name: "Services",
      href: "/dashboard/services",
      icon: "Wrench",
      roles: ["ADMIN"],
    },
    {
      name: "Timeline",
      href: "/dashboard/timeline",
      icon: "Square",
      roles: ["ADMIN", "DJ"],
    },
    {
      name: "Payments",
      href: "/dashboard/payments",
      icon: "DollarSign",
      roles: ["ADMIN"],
    },
    {
      name: "AI Assistant",
      href: "/dashboard/ai",
      icon: "Bot",
      roles: ["ADMIN", "DJ"],
    },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      icon: "Bell",
      roles: ["ADMIN", "DJ", "CLIENT"],
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: "Settings",
      roles: ["ADMIN"],
    },
  ]);

  useEffect(() => {
    // Filter items based on user role
    const filteredItems = items.filter((item) =>
      item.roles.includes(userRole)
    );
    // Update state with filtered items (this triggers re-render)
    // We keep the original items but just control rendering via the hasAccess check below
  }, [userRole]);

  return (
    <aside
      className={
        "flex sidebar w-64 h-full border-r bg-surface transition-colors " +
        collapsed ? "w-16" : "w-64"
      }
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <Link
            href="/"
            className="flex items-center gap-3 text-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <span className="text-2xl">FP</span>
            <span>Event Planner</span>
          </Link>
        </div>
        <nav className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto">
          {items.map((item) => {
            const hasAccess =
              item.roles.includes(userRole);
            if (!hasAccess) return null;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <span
                  className={
                    "inline-block w-5 h-5 " + item.icon + (collapsed ? " text-foreground" : " opacity-0")
                  }
                />
                <span className={collapsed ? "hidden" : "flex-1"}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border mt-auto">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>
    </aside>
  );
}