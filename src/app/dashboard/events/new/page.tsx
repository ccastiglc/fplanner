import { eventAccess } from "@/lib/event-access";
import { eventOptions } from "@/lib/event-form-data";
import { getSettingsOrganizationId } from "@/lib/settings-organization";
import EventForm from "@/components/events/event-form";

export default async function NewEventPage() {
  const { user } = await eventAccess(true);
  const organizationId = await getSettingsOrganizationId(user.organizationId);
  return <div className="mx-auto max-w-5xl space-y-5"><h1 className="text-2xl font-semibold text-slate-900">Add event</h1><EventForm options={await eventOptions(user.organizationId)} event={{ id: "", organizationId, name: "", type: "Wedding", status: "New Lead", eventDate: "", timezone: "America/New_York", endNextDay: false, startTime: "", endTime: "", setupTime: "", clientId: "", venueId: "", secondVenueId: "", guestCount: "", notes: "", details: {}, staff: [], services: [] }} /></div>;
}
