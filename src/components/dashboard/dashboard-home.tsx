import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/common/page-header";
import DashboardCalendar from "@/components/dashboard/dashboard-calendar";
import { EventCountsWidget, TasksWidget, WidgetPlaceholder, UpcomingEvents } from "@/components/dashboard/dashboard-widgets";
import { visibleEvents } from "@/lib/event-access";

export default async function DashboardHome() {
  const [records, session] = await Promise.all([visibleEvents(), auth()]);
  const events = records.map((event) => ({ id: event.id, date: event.eventDate.toISOString().slice(0, 10), type: event.type, clients: event.client ? [event.client.name, ...event.client.persons.map((person) => person.name)].join(" & ") : event.name, venue: event.venue?.name ?? "Venue not selected", status: event.status.toLowerCase(), services: [...new Set(event.eventServices.map((row) => row.service.name))] }));
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = records.filter((event) => event.eventDate.toISOString().slice(0, 10) >= today).slice(0, 5);
  return (
    <div className="dashboard-home">
      <PageHeader title="Your events at a glance" eyebrow="Dashboard Home" description="Calendar and planning overview for your team.">
        {session?.user.role === "ADMIN" && <Link href="/dashboard/events/new" className="ui-button ui-button-primary"><Plus aria-hidden="true" className="size-4" />Add event</Link>}
      </PageHeader>
      <div className="dashboard-grid">
        <DashboardCalendar events={events} initialDate={today} />
        <aside aria-label="Planning overview" className="dashboard-aside">
          <UpcomingEvents events={upcoming.map((event) => ({ id: event.id, name: event.name, date: event.eventDate.toISOString().slice(0, 10), type: event.type, venue: event.venue?.name ?? "Venue not selected", status: event.status }))} />
          <details className="dashboard-extras ui-surface">
            <summary>Workspace overview<ChevronDown aria-hidden="true" /></summary>
            <div className="dashboard-extra-sections">
              <EventCountsWidget counts={Object.entries(records.reduce<Record<string, number>>((counts, event) => ({ ...counts, [event.status]: (counts[event.status] ?? 0) + 1 }), {}))} />
              <TasksWidget />
              <WidgetPlaceholder />
            </div>
          </details>
        </aside>
      </div>
    </div>
  );
}
