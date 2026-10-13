import DashboardCalendar from "@/components/dashboard/dashboard-calendar";
import { EventCountsWidget, TasksWidget, WidgetPlaceholder } from "@/components/dashboard/dashboard-widgets";
import { visibleEvents } from "@/lib/event-access";

export default async function DashboardHome() {
  const records = await visibleEvents();
  const events = records.map((event) => ({ id: event.id, date: event.eventDate.toISOString().slice(0, 10), type: event.type, clients: event.client ? [event.client.name, ...event.client.persons.map((person) => person.name)].join(" & ") : event.name, venue: event.venue?.name ?? "Venue not selected", status: event.status.toLowerCase(), services: [...new Set(event.eventServices.map((row) => row.service.name))] }));
  return (
    <div className="mx-auto w-full max-w-[1800px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-orange-600">Dashboard Home</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Your events at a glance</h1>
          <p className="mt-1 text-sm text-slate-500">Calendar and planning overview for your team.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">Admin &amp; staff dashboard</span>
      </div>
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <DashboardCalendar events={events} />
        <aside aria-label="Dashboard widgets" className="space-y-5">
          <TasksWidget />
          <EventCountsWidget counts={Object.entries(records.reduce<Record<string, number>>((counts, event) => ({ ...counts, [event.status]: (counts[event.status] ?? 0) + 1 }), {}))} />
          <WidgetPlaceholder />
        </aside>
      </div>
    </div>
  );
}
