import { eventAccess } from "@/lib/event-access";
import { eventOptions } from "@/lib/event-form-data";
import { getSettingsOrganizationId } from "@/lib/settings-organization";
import { EVENT_FORM_SECTIONS } from "@/lib/event-fields";
import EventForm from "@/components/events/event-form";
import SectionNavigation from "@/components/common/section-navigation";

export default async function NewEventPage() {
  const { user } = await eventAccess(true);
  const organizationId = await getSettingsOrganizationId(user.organizationId);
  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6">
      <header><p className="text-sm font-medium text-orange-600">Event management</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Add event</h1><p className="mt-1 text-sm text-slate-500">Set up the schedule, linked profiles, and booked services.</p></header>
      <SectionNavigation label="New event sections" sections={EVENT_FORM_SECTIONS} />
      <EventForm options={await eventOptions(user.organizationId)} event={{ id: "", organizationId, name: "", type: "Wedding", status: "New Lead", eventDate: "", timezone: "America/New_York", endNextDay: false, startTime: "", endTime: "", setupTime: "", clientId: "", venueId: "", secondVenueId: "", guestCount: "", notes: "", details: {}, staff: [], services: [] }} />
    </div>
  );
}
