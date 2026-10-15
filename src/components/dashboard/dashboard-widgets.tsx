import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { DEMO_TASKS } from "@/components/dashboard/dashboard-data";
import { eventStatusColor } from "@/lib/event-status-colors";

export function UpcomingEvents({ events }: { events: { id: string; name: string; date: string; type: string; venue: string; status: string }[] }) {
  return (
    <section aria-labelledby="upcoming-events-title" className="dashboard-upcoming ui-surface">
      <div className="dashboard-widget-heading"><h2 id="upcoming-events-title">Upcoming events</h2><CalendarDays aria-hidden="true" /></div>
      {events.length ? <ul className="dashboard-upcoming-list">
        {events.map((event) => <li key={event.id}>
          <Link href={`/dashboard/events/${event.id}`} className="dashboard-upcoming-link">
            <span className="dashboard-upcoming-meta"><time dateTime={event.date}>{new Date(`${event.date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</time><span className={`dashboard-status ${eventStatusColor(event.status).badge}`}>{event.status}</span></span>
            <span className="dashboard-upcoming-name">{event.name}</span>
            <span className="dashboard-supporting">{event.type} · {event.venue}</span>
          </Link>
        </li>)}
      </ul> : <p className="dashboard-empty">No upcoming events. Your scheduled events will appear here.</p>}
      <Link href="/dashboard/events?when=upcoming&sort=date-asc" className="dashboard-view-all">View upcoming events<ArrowUpRight aria-hidden="true" /></Link>
    </section>
  );
}

export function EventCountsWidget({ counts }: { counts: [string, number][] }) {
  return (
    <section aria-labelledby="event-counts-title" className="dashboard-widget">
      <h2 id="event-counts-title">Event counts</h2>
      <dl className="dashboard-counts">
        {counts.map(([status, count]) => <div key={status}><dt><span aria-hidden="true" className={`dashboard-status-dot ${eventStatusColor(status).dot}`} />{status}</dt><dd>{count}</dd></div>)}
      </dl>
      {!counts.length && <p className="dashboard-supporting">No events yet.</p>}
    </section>
  );
}

export function TasksWidget() {
  return (
    <section aria-labelledby="tasks-title" className="dashboard-widget">
      <h2 id="tasks-title">Task automation preview</h2>
      <p className="dashboard-supporting">Example suggestions. AI recommendations and automation are not active.</p>
      <div className="dashboard-example-tasks">
        {DEMO_TASKS.map((task) => <article key={task.title}>
          <h3>{task.title}</h3>
          <p className="dashboard-supporting">{task.detail}</p>
          <button type="button" disabled title="Task automation will be added later" className="ui-button">{task.action}</button>
        </article>)}
      </div>
    </section>
  );
}

export function WidgetPlaceholder() {
  return (
    <section aria-labelledby="workspace-options-title" className="dashboard-widget">
      <h2 id="workspace-options-title">Your workspace</h2>
      <p className="dashboard-supporting">Admin widget customization will be added later.</p>
      <span aria-disabled="true" className="dashboard-unavailable">Customize · not available yet</span>
    </section>
  );
}
