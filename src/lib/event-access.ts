import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { completePastBookedEvents } from "@/lib/event-status.mjs";

export async function eventAccess(adminOnly = false) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  if (session.user.role === "CLIENT" || (adminOnly && session.user.role !== "ADMIN")) notFound();
  const where = session.user.role === "ADMIN"
    ? (session.user.organizationId ? { organizationId: session.user.organizationId } : {})
    : { organizationId: session.user.organizationId ?? "", staffAssignments: { some: { staff: { userId: session.user.id } } } };
  return { user: session.user, where };
}

export const eventRelations = {
  client: { include: { persons: true } },
  venue: true,
  secondVenue: true,
  staffAssignments: { include: { staff: true } },
  eventServices: { include: { service: true } },
} as const;

export async function visibleEvents() {
  const { where } = await eventAccess();
  await completePastBookedEvents(prisma);
  return prisma.event.findMany({ where, include: eventRelations, orderBy: { eventDate: "asc" } });
}
