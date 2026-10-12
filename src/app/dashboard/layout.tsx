import DashboardLayout from "@/components/dashboard/dashboard-layout";

export default function DashboardRouteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
