import { notFound } from "next/navigation";
import { eventAccess } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";
import { saveStaff } from "@/app/actions/staff";
import { eventInputClass } from "@/components/events/event-detail-fields";
import EventReturnLink from "@/components/events/event-return-link";
import PhoneInput from "@/components/common/phone-input";
import { PageHeader } from "@/components/common/page-header";

export default async function StaffProfilePage({ params, searchParams }: { params: Promise<{ staffId: string }>; searchParams: Promise<{ error?: string; saved?: string; eventId?: string }> }) {
  const { user } = await eventAccess(true);
  const [{ staffId }, query] = await Promise.all([params, searchParams]);
  const person = staffId === "new" ? null : await prisma.staff.findFirst({ where: { id: staffId, ...(user.organizationId ? { organizationId: user.organizationId } : {}) } });
  if (staffId !== "new" && !person) notFound();
  return (
    <article className="mx-auto max-w-4xl space-y-5">
      <EventReturnLink eventId={query.eventId} />
      <PageHeader title={person ? `Staff profile: ${person.name}` : "Add staff"} eyebrow="Team management" />
      {query.error && <p role="alert" className="ui-feedback ui-feedback-error">Check the name, email, and hourly rate.</p>}
      {query.saved && <p role="status" className="ui-feedback ui-feedback-success">Staff saved.</p>}
      <form action={saveStaff} className="record-form ui-surface grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="staffId" value={person?.id ?? ""} />
        <input type="hidden" name="eventContextId" value={query.eventId ?? ""} />
        {(["name", "email", "specialty", "status"] as const).map((name) => <label key={name} className="ui-label capitalize">{name}{name === "name" && <span aria-hidden="true" className="required-indicator"> *</span>}<input name={name} defaultValue={person?.[name] ?? ""} required={name === "name"} maxLength={160} className={eventInputClass} /></label>)}
        <div className="ui-label">Phone<PhoneInput label="Staff phone" className="mt-1.5" countryName="phoneCountry" numberName="phone" defaultCountry={person?.phoneCountry} defaultNumber={person?.phone} /></div>
        <label className="ui-label">Hourly rate<input name="hourlyRate" defaultValue={person?.hourlyRate?.toString() ?? "0"} className={eventInputClass} /></label>
        <label className="ui-label sm:col-span-2">Notes<textarea name="notes" defaultValue={person?.notes ?? ""} maxLength={10000} rows={4} className={eventInputClass} /></label>
        <button className="ui-button ui-button-primary justify-self-start">Save staff</button>
      </form>
    </article>
  );
}
