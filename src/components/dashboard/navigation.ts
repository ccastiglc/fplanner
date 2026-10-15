import { BriefcaseBusiness, Building2, CalendarDays, CircleDollarSign, LayoutDashboard, Settings, UsersRound, Wrench } from "lucide-react";

export const NAV_ITEMS = [
  { label: "Dashboard Home", href: "/dashboard", icon: LayoutDashboard, ready: true, adminOnly: false },
  { label: "Events", href: "/dashboard/events", icon: CalendarDays, ready: true, adminOnly: false },
  { label: "Clients", href: "/dashboard/clients", icon: UsersRound, ready: true, adminOnly: true },
  { label: "Venues", href: "/dashboard/venues", icon: Building2, ready: true, adminOnly: true },
  { label: "Staff", href: "/dashboard/staff", icon: BriefcaseBusiness, ready: true, adminOnly: true },
  { label: "Services", href: "/dashboard/services", icon: Wrench, ready: false, adminOnly: false },
  { label: "Payments", href: "/dashboard/payments", icon: CircleDollarSign, ready: false, adminOnly: false },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, ready: true, adminOnly: true },
] as const;
