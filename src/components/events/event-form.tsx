"use client";

import { useActionState, useState } from "react";
import { Mail, Phone } from "lucide-react";
import { saveEvent } from "@/app/actions/events";
import { EVENT_STATUSES } from "@/lib/event-fields";
import EventDetailFields, { eventInputClass } from "@/components/events/event-detail-fields";
import { AssignmentRows, ProfileSelect, ServiceRows } from "@/components/events/event-linked-records";
import EventSection from "@/components/events/event-section";

export default function EventForm({ event, options }: {
  event: { id: string; organizationId: string; name: string; type: string; status: string; eventDate: string; timezone: string; startTime: string; endTime: string; setupTime: string; endNextDay: boolean; clientId: string; venueId: string; secondVenueId: string; guestCount: string; notes: string; details: Record<string, string>; staff: { staffId: string; role: string; fee: string }[]; services: { serviceId: string; quantity: number; bookedFee: string }[] };
  options: { clients: { id: string; organizationId: string; name: string; email: string | null; phone: string | null; persons: { id: string; name: string; email: string | null; phone: string | null }[] }[]; venues: { id: string; organizationId: string; name: string }[]; staff: { id: string; organizationId: string; name: string }[]; services: { id: string; organizationId: string; name: string; price: string }[] };
}) {
  const [state, action, pending] = useActionState(saveEvent, { error: "" });
  const [clientId, setClientId] = useState(event.clientId);
  const [venueId, setVenueId] = useState(event.venueId);
  const [secondVenueId, setSecondVenueId] = useState(event.secondVenueId);
  const [staff, setStaff] = useState(event.staff);
  const [services, setServices] = useState(event.services);
  const organizationId = event.organizationId;
  const selectedClient = options.clients.find((item) => item.id === clientId);
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="eventId" value={event.id} />
      <input type="hidden" name="organizationId" value={organizationId} />
      {state.error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{state.error}</p>}
      <fieldset disabled={pending} className="space-y-6 disabled:opacity-70">
        <EventSection id="event-overview" title="Overview" grid>
          <label className="text-sm font-medium text-slate-700">Event name<input name="name" required maxLength={200} defaultValue={event.name} className={eventInputClass} /></label>
          <label className="text-sm font-medium text-slate-700">Event type<input name="type" required maxLength={120} defaultValue={event.type} className={eventInputClass} /></label>
          <label className="text-sm font-medium text-slate-700">Status<select name="status" defaultValue={event.status} className={eventInputClass}>{[...new Set([...EVENT_STATUSES, event.status])].map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Event date<input type="date" name="eventDate" required defaultValue={event.eventDate} className={eventInputClass} /></label>
          <div className="flex flex-wrap items-end gap-4 sm:col-span-2">
            <label className="min-w-[140px] flex-1 text-sm font-medium text-slate-700">Time zone<input name="timezone" required defaultValue={event.timezone} className={eventInputClass} /></label>
            {(["setupTime", "startTime", "endTime"] as const).map((name) => <label key={name} className="min-w-[104px] flex-1 text-sm font-medium text-slate-700">{name === "setupTime" ? "Setup time" : name === "startTime" ? "Start time" : "End time"}<input type="time" name={name} defaultValue={event[name]} className={eventInputClass} /></label>)}
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="endNextDay" defaultChecked={event.endNextDay} />End is on the following day</label>
          </div>
          <label className="text-sm font-medium text-slate-700">Guest count / estimate<input name="guestCount" maxLength={160} defaultValue={event.guestCount} className={eventInputClass} /></label>
          <label className="text-sm font-medium text-slate-700">Attire<input name="detail:Attire" maxLength={50000} defaultValue={event.details.Attire ?? ""} className={eventInputClass} /></label>
        </EventSection>
        <EventSection id="event-profiles" title="Clients" grid>
          <ProfileSelect label="Client" name="clientId" value={clientId} onChange={setClientId} records={options.clients.filter((item) => item.organizationId === organizationId)} directory="clients" />
          {selectedClient && (
            <div className="sm:col-span-2 space-y-1.5">
              <ul className="space-y-1.5">
                {[{ id: "client", name: selectedClient.name, email: selectedClient.email, phone: selectedClient.phone }, ...selectedClient.persons.map((p) => ({ id: p.id, name: p.name, email: p.email, phone: p.phone }))].map((r) => (
                  <li key={r.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="font-medium">{r.name}</span>
                    {r.email && <a href={`mailto:${r.email}`} aria-label={`Email ${r.name}`} className="text-slate-500 hover:text-orange-700"><Mail aria-hidden="true" className="size-4" /></a>}
                    {r.phone && <a href={`tel:${r.phone.replace(/[^+\d]/g, "")}`} aria-label={`Call ${r.name}`} className="text-slate-500 hover:text-orange-700"><Phone aria-hidden="true" className="size-4" /></a>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </EventSection>
        <EventSection id="event-venues" title="Venues" grid>
          <ProfileSelect label="Venue" name="venueId" value={venueId} onChange={setVenueId} records={options.venues.filter((item) => item.organizationId === organizationId)} directory="venues" />
          <ProfileSelect label="Second venue" name="secondVenueId" value={secondVenueId} onChange={setSecondVenueId} records={options.venues.filter((item) => item.organizationId === organizationId)} directory="venues" />
        </EventSection>
        <AssignmentRows rows={staff} setRows={setStaff} records={options.staff.filter((item) => item.organizationId === organizationId)} />
        <ServiceRows rows={services} setRows={setServices} records={options.services.filter((item) => item.organizationId === organizationId)} />
        <EventDetailFields details={event.details} />
        <EventSection id="event-notes" title="Notes"><label className="block text-sm font-medium text-slate-700">Comments / event notes<textarea name="notes" defaultValue={event.notes} maxLength={50000} rows={5} className={eventInputClass} /></label></EventSection>
        <button type="submit" className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-brand-accent-foreground">{pending ? "Saving…" : "Save event"}</button>
      </fieldset>
    </form>
  );
}
