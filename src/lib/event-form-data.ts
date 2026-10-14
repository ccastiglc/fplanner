import { prisma } from "@/lib/prisma";
import { eventRelations } from "@/lib/event-access";
import { recordObject } from "@/lib/event-fields";
import type { Prisma } from "@prisma/client";

export async function eventOptions(organizationId: string | null) {
  const where = organizationId ? { organizationId } : {};
  const [clients, venues, staff, services] = await Promise.all([
    prisma.client.findMany({ where, include: { persons: true }, orderBy: { name: "asc" } }),
    prisma.venue.findMany({ where, select: { id: true, organizationId: true, name: true }, orderBy: { name: "asc" } }),
    prisma.staff.findMany({ where, select: { id: true, organizationId: true, name: true }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where, select: { id: true, organizationId: true, name: true, price: true }, orderBy: { name: "asc" } }),
  ]);
  return { venues, staff, clients: clients.map((client) => ({ id: client.id, organizationId: client.organizationId, name: [client.name, ...client.persons.map((person) => person.name)].join(" & "), email: client.email, phone: client.phone })), services: services.map((service) => ({ ...service, price: service.price.toString() })) };
}

export function eventFormData(event: Prisma.EventGetPayload<{ include: typeof eventRelations }>) {
  return {
    id: event.id, organizationId: event.organizationId, name: event.name, type: event.type, status: event.status,
    eventDate: event.eventDate.toISOString().slice(0, 10), timezone: event.timezone, endNextDay: event.endNextDay,
    startTime: event.startTime ?? "", endTime: event.endTime ?? "", setupTime: event.setupTime ?? "",
    clientId: event.clientId ?? "", venueId: event.venueId ?? "", secondVenueId: event.secondVenueId ?? "",
    guestCount: event.guestCount ?? "", notes: event.notes ?? "", details: recordObject(event.details),
    staff: event.staffAssignments.map((row) => ({ staffId: row.staffId, role: row.role, fee: row.fee?.toString() ?? "0" })),
    services: event.eventServices.map((row) => ({ serviceId: row.serviceId, quantity: row.quantity, bookedFee: row.bookedFee?.toString() ?? "0" })),
  };
}
