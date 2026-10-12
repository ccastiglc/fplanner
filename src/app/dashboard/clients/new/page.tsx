import { notFound } from "next/navigation";
import { auth } from "@/auth";
import ClientForm from "@/components/clients/client-form";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") notFound();

  const { error } = await searchParams;
  return <ClientForm error={error} />;
}
