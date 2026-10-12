import { auth } from "@/auth";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { redirect } from "next/navigation";

export default async function DashboardRouteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  if (session.user.role === "CLIENT") {
    redirect("/client");
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
