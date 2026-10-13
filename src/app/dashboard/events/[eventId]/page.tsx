import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { eventAccess, eventRelations } from "@/lib/event-access";
import { eventOptions, eventFormData } from "@/lib/event-form-data";
import { localEventTime } from "@/lib/event-time";
import EventForm from "@/components/events/event-form";
import EventPlanning from "@/components/events/event-planning";
import { venueTimezone } from "@/lib/venue-timezone";
import { deleteEvent } from "@/app/actions/events";
import ConfirmDeleteButton from "@/components/common/confirm-delete-button";
import { completePastBookedEvents } from "@/lib/event-status.mjs";

export default async function EventProfilePage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { user, where } = await eventAccess();
  await completePastBookedEvents(prisma);
  const [{ eventId }, query] = await Promise.all([params, searchParams]);
  const event = await prisma.event.findFirst({ where: { ...where, id: eventId }, include: eventRelations });
  if (!event) notFound();
  const localZone = event.venue?.timezone ?? (event.venue ? await venueTimezone(event.venue.postalCode, event.venue.country) : null);
  return (
    <article className="mx-auto max-w-5xl space-y-5">
      <h1 className="text-2xl font-semibold text-slate-900">{event.name}</h1>
      {user.role === "ADMIN" && <ConfirmDeleteButton action={deleteEvent} fieldName="eventId" recordId={event.id} entityLabel="event" itemName={event.name} consequences="This permanently deletes the event, its staff/service assignments, and timeline. Linked client, venue, and staff profiles remain." />}
      {query.saved === "1" && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">Event saved.</p>}
      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <h2 className="font-semibold">Schedule</h2>
        <p className="mt-2">{event.timezone}: {localEventTime(event.startDateTime, event.timezone)} — {localEventTime(event.endDateTime, event.timezone)}</p>
        <p className="mt-2">Venue local time{localZone ? ` (${localZone})` : ""}: {localZone ? `${localEventTime(event.startDateTime, localZone)} — ${localEventTime(event.endDateTime, localZone)}` : "Set the venue's time zone or ZIP code to determine local time."}</p>
      </section>
      {Array.isArray(event.importIssues) && event.importIssues.length > 0 && <section className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><h2 className="font-semibold">Import review notes</h2><ul className="mt-2 list-inside list-disc">{event.importIssues.map((issue, index) => <li key={index}>{String(issue)}</li>)}</ul></section>}
      {user.role === "ADMIN" ? <EventForm event={eventFormData(event)} options={await eventOptions(event.organizationId)} /> : (
        <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700"><h2 className="font-semibold">Event details</h2><p>{event.type} · {event.status}</p><p>Client: {[event.client?.name, ...event.client?.persons.map((person) => person.name) ?? []].filter(Boolean).join(" & ") || "Not selected"}</p><p>Venue: {event.venue?.name ?? "Not selected"}</p><p>Staff: {event.staffAssignments.map((assignment) => assignment.staff.name).join(", ")}</p><p className="whitespace-pre-wrap">{event.notes}</p></section>
      )}
      <EventPlanning planning={event.planning} />
    </article>
  );
}
