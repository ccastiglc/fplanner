"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { eventAccess } from "@/lib/event-access";
import { BOOLEAN_FIELDS, DATE_FIELDS, EVENT_DETAIL_GROUPS, MONEY_FIELDS } from "@/lib/event-fields";
import { eventDateValue, eventInstants, validTimezone } from "@/lib/event-time";

const id = z.string().trim().max(128);
const money = z.string().trim().regex(/^-?\d{1,12}(?:\.\d{1,2})?$|^$/);
const time = z.string().regex(/^$|^(?:[01]\d|2[0-3]):[0-5]\d$/);
const inputSchema = z.object({
  eventId: id, organizationId: id.min(1), name: z.string().trim().min(1).max(200), type: z.string().trim().min(1).max(120),
  status: z.string().trim().min(1).max(80), eventDate: z.string(), timezone: z.string().refine(validTimezone),
  clientId: id, venueId: id, secondVenueId: id, startTime: time, endTime: time, setupTime: time,
  guestCount: z.string().trim().max(160), notes: z.string().trim().max(50000),
});
const staffSchema = z.array(z.object({ staffId: id.min(1), role: z.string().trim().max(120), fee: money })).max(15);
const servicesSchema = z.array(z.object({ serviceId: id.min(1), quantity: z.coerce.number().int().min(0).max(100000), bookedFee: money })).max(21);

function parseList(value: FormDataEntryValue | null) {
  try { return JSON.parse(String(value ?? "[]")); } catch { return null; }
}

export async function saveEvent(_state: { error: string }, formData: FormData) {
  const { user, where } = await eventAccess(true);
  const input = inputSchema.safeParse(Object.fromEntries(formData));
  const staff = staffSchema.safeParse(parseList(formData.get("staff")));
  const services = servicesSchema.safeParse(parseList(formData.get("services")));
  if (!input.success || !staff.success || !services.success) return { error: "Check the event fields, employee fees, and services." };
  const data = input.data;
  const eventDate = eventDateValue(data.eventDate);
  if (!eventDate) return { error: "Enter a valid event date." };
  const existing = data.eventId ? await prisma.event.findFirst({ where: { ...where, id: data.eventId } }) : null;
  if (data.eventId && !existing) return { error: "Event not found." };
  const organizationId = existing?.organizationId ?? user.organizationId ?? data.organizationId;
  if (existing && organizationId !== data.organizationId) return { error: "The event organization cannot be changed." };
  const details: Record<string, string> = {};
  for (const group of EVENT_DETAIL_GROUPS) {
    for (const label of group.fields) {
      const value = String(formData.get(`detail:${label}`) ?? "").trim();
      if (value.length > 50000 || (MONEY_FIELDS.has(label) && !money.safeParse(value).success) || (DATE_FIELDS.has(label) && value && !eventDateValue(value))) {
        return { error: `Check ${label}.` };
      }
      details[label] = BOOLEAN_FIELDS.has(label) ? String(value === "true") : value;
    }
  }
  const staffIds = staff.data.map((row) => row.staffId);
  const serviceIds = services.data.map((row) => row.serviceId);
  if (new Set(staffIds).size !== staffIds.length) return { error: "Select each employee only once." };
  const [organization, client, venue, secondVenue, employees, catalog] = await Promise.all([
    prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true } }),
    data.clientId ? prisma.client.findFirst({ where: { id: data.clientId, organizationId }, select: { id: true } }) : null,
    data.venueId ? prisma.venue.findFirst({ where: { id: data.venueId, organizationId }, select: { id: true } }) : null,
    data.secondVenueId ? prisma.venue.findFirst({ where: { id: data.secondVenueId, organizationId }, select: { id: true } }) : null,
    prisma.staff.count({ where: { id: { in: staffIds }, organizationId } }),
    prisma.service.count({ where: { id: { in: [...new Set(serviceIds)] }, organizationId } }),
  ]);
  if (!organization || (data.clientId && !client) || (data.venueId && !venue) || (data.secondVenueId && !secondVenue) || employees !== staffIds.length || catalog !== new Set(serviceIds).size) {
    return { error: "All linked records must belong to this event's organization." };
  }
  const nextDay = formData.get("endNextDay") === "on";
  if (data.startTime && data.endTime && !nextDay && data.endTime <= data.startTime) return { error: "End time must follow start time; select next-day end for an overnight event." };
  const instants = eventInstants(eventDate, data.startTime, data.endTime, nextDay, data.timezone);
  if ((instants.startDateTime && Number.isNaN(instants.startDateTime.getTime())) || (instants.endDateTime && Number.isNaN(instants.endDateTime.getTime()))) return { error: "Check the event time zone and times." };
  const eventData = {
    organizationId, name: data.name, type: data.type, status: data.status, eventDate, timezone: data.timezone,
    clientId: client?.id ?? null, venueId: venue?.id ?? null, secondVenueId: secondVenue?.id ?? null,
    startTime: data.startTime || null, endTime: data.endTime || null, setupTime: data.setupTime || null,
    endNextDay: nextDay, ...instants, guestCount: data.guestCount || null, notes: data.notes || null, details,
    staffAssignments: { ...(existing ? { deleteMany: {} } : {}), create: staff.data.map((row) => ({ staffId: row.staffId, role: row.role || "dj", fee: row.fee || "0" })) },
    eventServices: { ...(existing ? { deleteMany: {} } : {}), create: services.data.map((row) => ({ serviceId: row.serviceId, quantity: row.quantity, bookedFee: row.bookedFee || "0" })) },
  };
  const saved = existing
    ? await prisma.event.update({ where: { id: existing.id }, data: eventData })
    : await prisma.event.create({ data: { ...eventData, createdBy: user.id } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
  revalidatePath(`/dashboard/events/${saved.id}`);
  const destination = String(formData.get("openProfile") ?? "");
  const allowed = [client ? `clients/${client.id}` : "", venue ? `venues/${venue.id}` : "", secondVenue ? `venues/${secondVenue.id}` : "", ...staffIds.map((value) => `staff/${value}`)].filter(Boolean);
  if (destination && allowed.includes(destination)) redirect(`/dashboard/${destination}?eventId=${saved.id}`);
  redirect(`/dashboard/events/${saved.id}?saved=1`);
}

export async function deleteEvent(formData: FormData) {
  const { where } = await eventAccess(true);
  const eventId = String(formData.get("eventId") ?? "");
  if (String(formData.get("confirmation") ?? "").trim().toLowerCase() !== "delete") return;
  const event = await prisma.event.findFirst({ where: { ...where, id: eventId }, select: { id: true } });
  if (!event) return;
  await prisma.event.delete({ where: { id: event.id } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
  redirect("/dashboard/events");
}
