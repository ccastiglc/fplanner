import { notFound } from "next/navigation";
import { auth } from "@/auth";
import VenueForm from "@/components/venues/venue-form";

export default async function NewVenuePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") notFound();

  const { error } = await searchParams;
  return <VenueForm error={error} />;
}
