import type { Prisma } from "@prisma/client";
import { ImportRowError } from "@/lib/data-import";

export async function eventImportLink(transaction: Prisma.TransactionClient, entity: "client" | "venue" | "staff" | "service", organizationId: string, sourceId: string, name: string) {
  const djepId = sourceId && sourceId !== "0" ? sourceId : null;
  const where = { organizationId, ...(djepId ? { djepId } : {}), ...(djepId ? {} : { name: { equals: name, mode: "insensitive" as const } }) };
  const byName = { organizationId, name: { equals: name, mode: "insensitive" as const } };
  let matches = entity === "client" ? await transaction.client.findMany({ where }) : entity === "venue" ? await transaction.venue.findMany({ where }) : entity === "staff" ? await transaction.staff.findMany({ where }) : await transaction.service.findMany({ where });
  if (djepId && !matches.length && name) matches = entity === "client" ? await transaction.client.findMany({ where: byName }) : entity === "venue" ? await transaction.venue.findMany({ where: byName }) : entity === "staff" ? await transaction.staff.findMany({ where: byName }) : await transaction.service.findMany({ where: byName });
  if (entity === "client" && !matches.length && name) {
    const normalized = (text: string) => text.toLowerCase().replace(/\s*&\s*|\s+/g, " ").trim();
    const clients = await transaction.client.findMany({ where: { organizationId }, include: { persons: true } });
    matches = clients.filter((client) => normalized([client.name, ...client.persons.map((person) => person.name)].join(" ")) === normalized(name));
  }
  if (matches.length > 1) throw new ImportRowError(`Ambiguous ${entity} match; resolve duplicate profiles before importing this event.`);
  if (matches[0]) {
    const match = matches[0];
    if (djepId && match.djepId && match.djepId !== djepId) throw new ImportRowError(`Conflicting ${entity} source ID; review the existing profile.`);
    if (djepId && !match.djepId) {
      const data = { djepId };
      if (entity === "client") await transaction.client.update({ where: { id: match.id }, data });
      if (entity === "venue") await transaction.venue.update({ where: { id: match.id }, data });
      if (entity === "staff") await transaction.staff.update({ where: { id: match.id }, data });
      if (entity === "service") await transaction.service.update({ where: { id: match.id }, data });
    }
    return match.id;
  }
  return null;
}
