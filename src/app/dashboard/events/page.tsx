import Link from "next/link";
import { eventAccess, visibleEvents } from "@/lib/event-access";

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const [{ user }, records, query] = await Promise.all([eventAccess(), visibleEvents(), searchParams]);
  const term = (query.q ?? "").trim().slice(0, 120).toLowerCase();
  const events = records.filter((event) => (!query.status || event.status === query.status) && (!term || [event.name, event.type, event.client?.name, event.venue?.name, ...event.staffAssignments.map((row) => row.staff.name)].some((value) => value?.toLowerCase().includes(term))));
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex items-center justify-between"><h1 className="text-2xl font-semibold text-slate-900">Events</h1>{user.role === "ADMIN" && <Link href="/dashboard/events/new" className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-brand-accent-foreground">Add event</Link>}</header>
      <form className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4"><input type="search" name="q" aria-label="Search events" defaultValue={query.q} maxLength={120} placeholder="Search events, clients, venues, staff" className="min-w-64 flex-1 rounded-lg border border-slate-300 p-2 text-sm" /><select name="status" aria-label="Filter by status" defaultValue={query.status ?? ""} className="rounded-lg border border-slate-300 p-2 text-sm"><option value="">All statuses</option>{[...new Set(records.map((event) => event.status))].sort().map((status) => <option key={status}>{status}</option>)}</select><button className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Search</button></form>
      <section className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <p className="p-4 text-sm text-slate-500">{events.length} events</p>
        {events.map((event) => <Link key={event.id} href={`/dashboard/events/${event.id}`} className="block p-5 hover:bg-orange-50"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold text-slate-900">{event.name}</h2><span className="text-sm text-slate-600">{event.status}</span></div><p className="mt-1 text-sm text-slate-500">{event.eventDate.toISOString().slice(0, 10)} · {event.type} · {event.client?.name ?? "No client"} · {event.venue?.name ?? "No venue"}</p><p className="mt-2 text-xs text-slate-500">{event.staffAssignments.map((row) => row.staff.name).join(", ")}</p></Link>)}
        {!events.length && <p className="p-8 text-sm text-slate-500">No matching events.</p>}
      </section>
    </div>
  );
}
