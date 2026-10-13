import { notFound } from "next/navigation";
import { eventAccess } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";
import { saveStaff } from "@/app/actions/staff";
import { eventInputClass } from "@/components/events/event-detail-fields";
import EventReturnLink from "@/components/events/event-return-link";

export default async function StaffProfilePage({ params, searchParams }: { params: Promise<{ staffId: string }>; searchParams: Promise<{ error?: string; saved?: string; eventId?: string }> }) {
  const { user } = await eventAccess(true);
  const [{ staffId }, query] = await Promise.all([params, searchParams]);
  const person = staffId === "new" ? null : await prisma.staff.findFirst({ where: { id: staffId, ...(user.organizationId ? { organizationId: user.organizationId } : {}) } });
  if (staffId !== "new" && !person) notFound();
  return (
    <article className="mx-auto max-w-4xl space-y-5">
      <EventReturnLink eventId={query.eventId} />
      <h1 className="text-2xl font-semibold text-slate-900">{person ? `Staff profile: ${person.name}` : "Add staff"}</h1>
      {query.error && <p role="alert" className="text-sm text-red-700">Check the name, email, and hourly rate.</p>}
      {query.saved && <p role="status" className="text-sm text-emerald-700">Staff saved.</p>}
      <form action={saveStaff} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <input type="hidden" name="staffId" value={person?.id ?? ""} />
        <input type="hidden" name="eventContextId" value={query.eventId ?? ""} />
        {(["name", "email", "phone", "specialty", "status"] as const).map((name) => <label key={name} className="text-sm font-medium capitalize text-slate-700">{name}<input name={name} defaultValue={person?.[name] ?? ""} required={name === "name"} maxLength={160} className={eventInputClass} /></label>)}
        <label className="text-sm font-medium text-slate-700">Hourly rate<input name="hourlyRate" defaultValue={person?.hourlyRate?.toString() ?? "0"} className={eventInputClass} /></label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Notes<textarea name="notes" defaultValue={person?.notes ?? ""} maxLength={10000} rows={4} className={eventInputClass} /></label>
        <button className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-brand-accent-foreground">Save staff</button>
      </form>
    </article>
  );
}
