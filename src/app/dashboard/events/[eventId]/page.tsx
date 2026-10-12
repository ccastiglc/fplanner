import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { DEMO_EVENTS, SERVICE_ICONS } from "@/components/dashboard/dashboard-data";

export default async function EventProfilePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = DEMO_EVENTS.find((item) => item.id === eventId);

  if (!event) notFound();

  return (
    <article className="mx-auto w-full max-w-4xl">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-orange-600"><ArrowLeft className="size-4" />Back to dashboard</Link>
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-orange-600">Demo event profile</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{event.type} · {event.clients}</h1>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${event.status === "pending" ? "bg-amber-50 text-amber-800" : event.status === "completed" ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-700"}`}>{event.status}</span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-500"><CalendarDays className="size-4 text-orange-500" />Event date</p>
            <p className="mt-2 font-semibold text-slate-900">{new Date(`${event.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-500"><MapPin className="size-4 text-orange-500" />Venue</p>
            <p className="mt-2 font-semibold text-slate-900">{event.venue}</p>
          </div>
        </div>
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-900">Booked services</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {event.services.map((service) => {
              const ServiceIcon = SERVICE_ICONS[service];
              return <span key={service} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700"><ServiceIcon className="size-4 text-orange-600" />{service}</span>;
            })}
          </div>
        </div>
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-relaxed text-slate-500">This is a visual profile scaffold using sample data. Event editing, client records, timeline, payments, and permission checks are not connected yet.</p>
      </section>
    </article>
  );
}
