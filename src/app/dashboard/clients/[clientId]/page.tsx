import { notFound } from "next/navigation";
import { auth } from "@/auth";
import ClientForm from "@/components/clients/client-form";
import { prisma } from "@/lib/prisma";
import EventReturnLink from "@/components/events/event-return-link";

export default async function ClientProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ error?: string; saved?: string; eventId?: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") notFound();

  const [{ clientId }, query] = await Promise.all([params, searchParams]);
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      ...(session.user.organizationId ? { organizationId: session.user.organizationId } : {}),
    },
    include: {
      phoneNumbers: true,
      persons: { include: { phoneNumbers: true } },
      additionalContacts: { include: { phoneNumbers: true } },
    },
  });
  if (!client) notFound();

  return (
    <>
      <EventReturnLink eventId={query.eventId} />
      {query.saved === "1" && <p role="status" className="ui-feedback ui-feedback-success mx-auto mb-4 max-w-4xl">Client profile saved.</p>}
      <ClientForm client={client} error={query.error} eventId={query.eventId} />
    </>
  );
}
