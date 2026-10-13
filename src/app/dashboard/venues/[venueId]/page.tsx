import { notFound } from "next/navigation";
import { auth } from "@/auth";
import VenueForm from "@/components/venues/venue-form";
import { prisma } from "@/lib/prisma";

export default async function VenueProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ venueId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") notFound();

  const [{ venueId }, query] = await Promise.all([params, searchParams]);
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, ...(session.user.organizationId ? { organizationId: session.user.organizationId } : {}) },
    include: { contacts: { orderBy: { sortOrder: "asc" } } },
  });
  if (!venue) notFound();

  return (
    <>
      {query.saved === "1" && <p role="status" className="mx-auto mb-4 max-w-5xl rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Venue profile saved.</p>}
      <VenueForm venue={venue} error={query.error} />
    </>
  );
}
