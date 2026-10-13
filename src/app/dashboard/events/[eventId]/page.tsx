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
import SectionNavigation from "@/components/common/section-navigation";
import EventSection from "@/components/events/event-section";
import { EVENT_FORM_SECTIONS } from "@/lib/event-fields";
import { eventStatusColor } from "@/lib/event-status-colors";

export default async function EventProfilePage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { user, where } = await eventAccess();
  const [{ eventId }, query] = await Promise.all([params, searchParams]);
  const event = await prisma.event.findFirst({ where: { ...where, id: eventId }, include: eventRelations });
  if (!event) notFound();
  const localZone = event.venue?.timezone ?? (event.venue ? await venueTimezone(event.venue.postalCode, event.venue.country) : null);
  const hasReviewNotes = Array.isArray(event.importIssues) && event.importIssues.length > 0;
  const sections = [
    { id: "event-schedule", label: "Schedule" },
    ...(hasReviewNotes ? [{ id: "event-review", label: "Import Review" }] : []),
    ...(user.role === "ADMIN" ? EVENT_FORM_SECTIONS : [{ id: "event-overview", label: "Overview" }]),
    { id: "event-planning", label: "Planning" },
  ];
  return (
    <article className="mx-auto w-full max-w-[1200px] space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm font-medium text-orange-600">Event management</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{event.name}</h1><p className="mt-1 text-sm text-slate-500">Manage the schedule, linked profiles, services, and planning details.</p></div>
        <div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${eventStatusColor(event.status).badge}`}>{event.status}</span>{user.role === "ADMIN" && <ConfirmDeleteButton action={deleteEvent} fieldName="eventId" recordId={event.id} entityLabel="event" itemName={event.name} consequences="This permanently deletes the event, its staff/service assignments, and timeline. Linked client, venue, and staff profiles remain." />}</div>
      </header>
      <SectionNavigation label="Event profile sections" sections={sections} />
      {query.saved === "1" && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">Event saved.</p>}
      <EventSection id="event-schedule" title="Schedule">
        <p className="text-sm text-slate-700">{event.timezone}: {localEventTime(event.startDateTime, event.timezone)} — {localEventTime(event.endDateTime, event.timezone)}</p>
        <p className="text-sm text-slate-700">Venue local time{localZone ? ` (${localZone})` : ""}: {localZone ? `${localEventTime(event.startDateTime, localZone)} — ${localEventTime(event.endDateTime, localZone)}` : "Set the venue's time zone or ZIP code to determine local time."}</p>
      </EventSection>
      {hasReviewNotes && <EventSection id="event-review" title="Import review notes"><ul className="list-inside list-disc rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{(event.importIssues as string[]).map((issue, index) => <li key={index}>{String(issue)}</li>)}</ul></EventSection>}
      {user.role === "ADMIN" ? <EventForm event={eventFormData(event)} options={await eventOptions(event.organizationId)} /> : (
        <EventSection id="event-overview" title="Overview"><div className="space-y-2 text-sm text-slate-700"><p>{event.type} · {event.status}</p><p>Client: {[event.client?.name, ...event.client?.persons.map((person) => person.name) ?? []].filter(Boolean).join(" & ") || "Not selected"}</p><p>Venue: {event.venue?.name ?? "Not selected"}</p><p>Staff: {event.staffAssignments.map((assignment) => assignment.staff.name).join(", ")}</p><p className="whitespace-pre-wrap">{event.notes}</p></div></EventSection>
      )}
      <EventPlanning planning={event.planning} />
    </article>
  );
}
