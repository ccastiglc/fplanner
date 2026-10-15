import { eventAccess } from "@/lib/event-access";
import { eventOptions } from "@/lib/event-form-data";
import { getSettingsOrganizationId } from "@/lib/settings-organization";
import { EVENT_FORM_SECTIONS } from "@/lib/event-fields";
import EventForm from "@/components/events/event-form";
import SectionNavigation from "@/components/common/section-navigation";
import { PageHeader } from "@/components/common/page-header";

export default async function NewEventPage() {
  const { user } = await eventAccess(true);
  const organizationId = await getSettingsOrganizationId(user.organizationId);
  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6">
      <PageHeader title="Add event" eyebrow="Event management" description="Set up the schedule, linked profiles, and booked services." />
      <SectionNavigation label="New event sections" sections={EVENT_FORM_SECTIONS} />
      <EventForm options={await eventOptions(user.organizationId)} event={{ id: "", organizationId, name: "", type: "Wedding", status: "New Lead", eventDate: "", timezone: "America/New_York", endNextDay: false, startTime: "", endTime: "", setupTime: "", clientId: "", venueId: "", secondVenueId: "", guestCount: "", notes: "", details: {}, staff: [], services: [] }} />
    </div>
  );
}
