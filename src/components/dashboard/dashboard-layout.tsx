"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/actions/auth";
import { AppearanceSelector } from "@/components/appearance-selector";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  Menu,
  Settings,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard Home", href: "/dashboard", icon: LayoutDashboard, ready: true, adminOnly: false },
  { label: "Events", href: "/dashboard/events", icon: CalendarDays, ready: true, adminOnly: false },
  { label: "Clients", href: "/dashboard/clients", icon: UsersRound, ready: true, adminOnly: true },
  { label: "Venues", href: "/dashboard/venues", icon: Building2, ready: true, adminOnly: true },
  { label: "Staff", href: "/dashboard/staff", icon: BriefcaseBusiness, ready: true, adminOnly: true },
  { label: "Services", href: "/dashboard/services", icon: Wrench, ready: false, adminOnly: false },
  { label: "Payments", href: "/dashboard/payments", icon: CircleDollarSign, ready: false, adminOnly: false },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, ready: true, adminOnly: true },
] as const;

export default function DashboardLayout({
  children,
  canManageClients,
  businessName,
  logoUrl,
}: Readonly<{ children: React.ReactNode; canManageClients: boolean; businessName: string; logoUrl: string | null }>) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = (
    <>
      <Link
        href="/dashboard"
        aria-label="Fredo Productions dashboard home"
        className={`mb-7 flex h-12 items-center gap-3 ${collapsed ? "justify-center" : "px-3"}`}
        onClick={() => setMobileOpen(false)}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={`${businessName} logo`} width={40} height={40} className="size-10 shrink-0 rounded-xl border border-slate-200 object-contain" />
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-500 text-sm font-bold text-brand-accent-foreground">FP</span>
        )}
        {!collapsed && (
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-900">{businessName}</span>
            <span className="block text-xs text-slate-500">Event Planner</span>
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="mb-4 hidden items-center justify-center rounded-xl border border-slate-200 p-2.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 md:flex"
      >
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
      </button>
      <nav aria-label="Dashboard navigation" className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon, ready, adminOnly }) => {
          if (adminOnly && !canManageClients) return null;

          const active = pathname.endsWith(href);
          const content = (
            <>
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{label}</span>}
              {!ready && !collapsed && <span className="text-[10px] text-slate-400">Soon</span>}
            </>
          );

          if (!ready) {
            return (
              <div
                key={href}
                aria-disabled="true"
                title={collapsed ? `${label} — coming soon` : undefined}
                className={`flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 ${collapsed ? "justify-center" : ""}`}
              >
                {content}
              </div>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                active
                  ? "bg-orange-50 font-semibold text-orange-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {content}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside
        className={`sticky top-0 z-20 hidden h-screen shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white p-4 transition-[width] duration-200 md:flex ${
          collapsed ? "w-[76px]" : "w-[264px]"
        }`}
      >
        {navigation}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/40"
          />
          <aside className="relative flex h-full w-[min(84vw,300px)] flex-col bg-white p-4 shadow-xl">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="mb-3 self-end rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="size-5" />
            </button>
            {navigation}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            >
              <Menu className="size-5" />
            </button>
            <span className="hidden text-sm font-medium text-slate-500 sm:inline">{businessName}</span>
            <span aria-hidden="true" className="hidden text-slate-300 sm:inline">/</span>
            <span className="text-sm font-semibold text-slate-900">Event Planner</span>
          </div>
          <div className="flex items-center gap-2">
            <AppearanceSelector />
            <form action={logout}>
              <button type="submit" className="ui-button">Sign out</button>
            </form>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
