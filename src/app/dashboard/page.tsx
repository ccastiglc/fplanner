"use client";

"use client";

import { notFound } from "next/navigation";
import Sidebar from "@/components/dashboard/sidebar";
import TopBar from "@/components/dashboard/topbar";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { useRouter } from "next/navigation";

interface DashboardPageProps {
  params: { path?: string[] };
}

export default function Dashboard({ params }: DashboardPageProps) {
  const router = useRouter();
  const path = params.path || [];
  const section = path[0] || "events";

  // Get user role from localStorage (set during auth)
  const userRole = (typeof window !== "undefined"
    ? localStorage.getItem("userRole")
    : "CLIENT") as "ADMIN" | "DJ" | "CLIENT";

  if (path.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <Sidebar userRole={userRole} />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 p-6 overflow-y-auto">
            <Breadcrumbs path={path} />
            <section className="space-y-6">
              {section === "events" && <h1>Events Section</h1>}
              {section === "clients" && <h1>Clients Section</h1>}
              {section === "venues" && <h1>Venues Section</h1>}
              {section === "staff" && <h1>Staff Section</h1>}
              {section === "vendors" && <h1>Vendors Section</h1>}
              {section === "services" && <h1>Services Section</h1>}
              {section === "timeline" && <h1>Timeline Section</h1>}
              {section === "payments" && <h1>Payments Section</h1>}
              {section === "ai" && <h1>AI Section</h1>}
              {section === "notifications" && <h1>Notifications Section</h1>}
              {section === "settings" && <h1>Settings Section</h1>}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}