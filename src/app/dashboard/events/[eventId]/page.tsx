import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { eventAccess, eventRelations } from "@/lib/event-access";
import { eventOptions, eventFormData } from "@/lib/event-form-data";
import EventForm from "@/components/events/event-form";
import EventPlanning from "@/components/events/event-planning";
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
  const eventDate = event.eventDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  const people = [
    ...(event.client ? [{ id: `client-${event.client.id}`, name: event.client.name, photo: event.client.photoStorageKey ? `/plan/api/client-photos/${event.client.photoStorageKey}` : event.client.photoUrl }] : []),
    ...(event.client?.persons ?? []).map((person) => ({ id: person.id, name: person.name, photo: person.photoStorageKey ? `/plan/api/client-photos/${person.photoStorageKey}` : person.photoUrl })),
  ];
  const hasReviewNotes = Array.isArray(event.importIssues) && event.importIssues.length > 0;
  const sections = [
    ...(user.role === "ADMIN" ? EVENT_FORM_SECTIONS : [{ id: "event-overview", label: "Overview" }]),
    { id: "event-planning", label: "Planning" },
    ...(user.role === "ADMIN" && hasReviewNotes ? [{ id: "event-review", label: "Import Review" }] : []),
  ];
  return (
    <article className="mx-auto w-full max-w-[1200px] space-y-6">
      <header className="event-profile-header">
        <div className="event-profile-identity">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Event management</p>
            <h1>{event.name}</h1>
            <time dateTime={event.eventDate.toISOString().slice(0, 10)}>{eventDate}</time>
            <p className="mt-1 text-sm text-secondary-foreground">Venue: {event.venue?.name ?? "Not selected"}</p>
          </div>
          {people.length > 0 && (
            <div className="event-profile-people">
              {people.map((person) => (
                <figure key={person.id}>
                  {person.photo ? (
                    <img src={person.photo} alt={`${person.name} profile`} width={64} height={64} className="mx-auto size-16 rounded-full border border-border object-cover" />
                  ) : (
                    <span aria-hidden="true" className="mx-auto grid size-16 place-items-center rounded-full bg-surface-secondary text-lg font-medium text-foreground">{person.name.slice(0, 1).toUpperCase()}</span>
                  )}
                  <figcaption>{person.name}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
        <div className="event-profile-actions"><span className={`ui-badge ${eventStatusColor(event.status).badge}`}>{event.status}</span>{user.role === "ADMIN" && <ConfirmDeleteButton action={deleteEvent} fieldName="eventId" recordId={event.id} entityLabel="event" itemName={event.name} consequences="This permanently deletes the event, its staff/service assignments, and timeline. Linked client, venue, and staff profiles remain." />}</div>
      </header>
      <SectionNavigation label="Event profile sections" sections={sections} />
      {query.saved === "1" && <p role="status" className="ui-feedback ui-feedback-success">Event saved.</p>}
      {user.role === "ADMIN" ? <EventForm event={eventFormData(event)} options={await eventOptions(event.organizationId)} /> : (
        <EventSection id="event-overview" title="Overview"><div className="space-y-2 text-sm text-secondary-foreground"><p>{event.type} · {event.status}</p><p>Client: {[event.client?.name, ...event.client?.persons.map((person) => person.name) ?? []].filter(Boolean).join(" & ") || "Not selected"}</p><p>Venue: {event.venue?.name ?? "Not selected"}</p><p>Staff: {event.staffAssignments.map((assignment) => assignment.staff.name).join(", ")}</p><p className="whitespace-pre-wrap">{event.notes}</p></div></EventSection>
      )}
      <EventPlanning planning={event.planning} />
      {user.role === "ADMIN" && hasReviewNotes && <EventSection id="event-review" title="Import review notes"><ul className="ui-feedback ui-feedback-warning list-inside list-disc">{(event.importIssues as string[]).map((issue, index) => <li key={index}>{String(issue)}</li>)}</ul></EventSection>}
    </article>
  );
}
