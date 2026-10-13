import { prisma } from "@/lib/prisma";

export async function getSettingsOrganizationId(organizationId: string | null) {
  if (organizationId) return organizationId;

  const organization = await prisma.organization.upsert({
    where: { slug: "fredo-productions" },
    create: { name: "Fredo Productions", slug: "fredo-productions" },
    update: {},
    select: { id: true },
  });

  return organization.id;
}
