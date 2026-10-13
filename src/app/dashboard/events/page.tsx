import Link from "next/link";
import { CalendarDays, Plus, Search } from "lucide-react";
import { eventAccess, visibleEvents } from "@/lib/event-access";
import { eventStatusColor } from "@/lib/event-status-colors";
import AlphabetIndex from "@/components/dashboard/alphabet-index";

const ALPHABET = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];

function firstLetter(name: string) {
  const letter = name.trim().slice(0, 1).toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : "#";
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; sort?: string; when?: string }> }) {
  const [{ user }, records, query] = await Promise.all([eventAccess(), visibleEvents(), searchParams]);
  const term = (query.q ?? "").trim().slice(0, 120).toLowerCase();
  const sort = query.sort === "date-asc" || query.sort === "date-desc" ? query.sort : "name";
  const when = query.when === "past" || query.when === "upcoming" ? query.when : "all";
  const today = dateOnly(new Date());

  const events = records.filter((event) => {
    if (query.status && event.status !== query.status) return false;
    if (when !== "all") {
      const past = dateOnly(event.eventDate) < today;
      if (when === "past" ? !past : past) return false;
    }
    if (term && ![event.name, event.type, event.client?.name, event.venue?.name, ...event.staffAssignments.map((row) => row.staff.name)].some((value) => value?.toLowerCase().includes(term))) return false;
    return true;
  });
  const statuses = [...new Set(records.map((event) => event.status))].sort();
  const hasFilters = Boolean(term || query.status || when !== "all");

  const groups = new Map<string, typeof events>();
  const months = new Map<string, { label: string; events: typeof events }>();
  if (sort === "name") {
    for (const event of events) {
      const letter = firstLetter(event.name);
      groups.set(letter, [...(groups.get(letter) ?? []), event]);
    }
  } else {
    const ordered = [...events].sort((a, b) => (sort === "date-asc" ? a.eventDate.getTime() - b.eventDate.getTime() : b.eventDate.getTime() - a.eventDate.getTime()));
    for (const event of ordered) {
      const key = dateOnly(event.eventDate).slice(0, 7);
      const group = months.get(key);
      if (group) group.events.push(event);
      else months.set(key, { label: event.eventDate.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }), events: [event] });
    }
  }
  const presentLetters = new Set(groups.keys());

  const eventRow = (event: (typeof records)[number], index: number) => (
    <Link key={event.id} href={`/dashboard/events/${event.id}`} className={`flex flex-col gap-4 p-4 transition hover:bg-orange-50/40 sm:px-5 lg:flex-row lg:items-center ${index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900">{event.name}</h3>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${eventStatusColor(event.status).badge}`}>{event.status}</span>
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-slate-500"><CalendarDays className="size-4 shrink-0" />{dateOnly(event.eventDate)} · {event.type} · {event.client?.name ?? "No client"} · {event.venue?.name ?? "No venue"}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500 lg:justify-end">
        <span>{event.staffAssignments.map((row) => row.staff.name).join(", ") || "No staff assigned"}</span>
      </div>
    </Link>
  );

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-orange-600">Event management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Events</h1>
          <p className="mt-1 text-sm text-slate-500">Browse, filter, and open event profiles.</p>
        </div>
        {user.role === "ADMIN" && (
          <Link href="/dashboard/events/new" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-brand-accent-foreground transition hover:bg-orange-600">
            <Plus className="size-4" />Add event
          </Link>
        )}
      </div>
      <form method="get" className="mb-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap">
        <label className="flex min-w-0 flex-1 items-center gap-2 px-2">
          <Search aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
          <input name="q" type="search" maxLength={120} defaultValue={query.q} placeholder="Search events, clients, venues, or staff" className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
        </label>
        <select name="status" aria-label="Filter by status" defaultValue={query.status ?? ""} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
          <option value="">All statuses</option>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
        <select name="when" aria-label="Filter by date" defaultValue={when} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
          <option value="all">All dates</option>
          <option value="upcoming">Upcoming events</option>
          <option value="past">Past events</option>
        </select>
        <select name="sort" aria-label="Sort events" defaultValue={sort} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
          <option value="name">Name (A–Z)</option>
          <option value="date-asc">Date (ascending)</option>
          <option value="date-desc">Date (descending)</option>
        </select>
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Search events</button>
        {hasFilters && <Link href="/dashboard/events" className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-600 hover:bg-slate-50">Clear</Link>}
      </form>
      <div className={`grid items-start gap-4 ${sort === "name" ? "lg:grid-cols-[minmax(0,1fr)_56px]" : ""}`}>
        <section aria-label="Event records" className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-sm font-medium text-slate-600"><CalendarDays className="size-4 text-orange-500" />{events.length} {events.length === 1 ? "event" : "events"}{term ? ` matching “${term}”` : ""}</div>
          {events.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <CalendarDays className="mx-auto size-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700">{hasFilters ? "No matching events" : "No events yet"}</p>
              <p className="mt-1 text-sm text-slate-500">{hasFilters ? "Try a different search, status, or date filter." : "Add an event or import your DJEP events."}</p>
            </div>
          ) : sort === "name" ? (
            <div>
              {ALPHABET.filter((letter) => groups.has(letter)).map((letter) => (
                <section key={letter} id={`events-${letter}`} className="scroll-mt-28">
                  <h2 className="border-b border-slate-100 bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{letter}</h2>
                  <div className="divide-y divide-slate-100">
                    {groups.get(letter)?.map((event, eventIndex) => eventRow(event, eventIndex))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div>
              {[...months.values()].map((month) => (
                <section key={month.label} className="scroll-mt-28">
                  <h2 className="border-b border-slate-100 bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{month.label}</h2>
                  <div className="divide-y divide-slate-100">
                    {month.events.map((event, eventIndex) => eventRow(event, eventIndex))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
        {sort === "name" && <AlphabetIndex prefix="events" letters={presentLetters} />}
      </div>
    </div>
  );
}
