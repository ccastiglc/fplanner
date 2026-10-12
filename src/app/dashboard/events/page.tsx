import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { DEMO_EVENTS, SERVICE_ICONS } from "@/components/dashboard/dashboard-data";

export default function EventsPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="mb-5">
        <p className="text-sm font-medium text-orange-600">Event management</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Events</h1>
        <p className="mt-1 text-sm text-slate-500">Sample schedule records; live organization data will be connected later.</p>
      </div>
      <section aria-label="Event list" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-sm font-medium text-slate-600"><CalendarDays className="size-4 text-orange-500" />{DEMO_EVENTS.length} sample events</div>
        <div className="divide-y divide-slate-100">
          {DEMO_EVENTS.map((event) => (
            <article key={event.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-900">{event.type} · {event.clients}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${event.status === "pending" ? "bg-amber-50 text-amber-800" : event.status === "completed" ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-700"}`}>{event.status}</span>
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="size-4" />{event.venue} · {new Date(`${event.date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {event.services.map((service) => {
                    const ServiceIcon = SERVICE_ICONS[service];
                    return <span key={service} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"><ServiceIcon className="size-3.5" />{service}</span>;
                  })}
                </div>
              </div>
              <Link href={`/dashboard/events/${event.id}`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700">
                View event <ArrowUpRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
