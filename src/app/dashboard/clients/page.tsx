import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function ClientsPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") notFound();

  const clients = await prisma.client.findMany({
    where: session.user.organizationId ? { organizationId: session.user.organizationId } : {},
    include: {
      persons: {
        select: { id: true, name: true, role: true, email: true, photoUrl: true, photoStorageKey: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-orange-600">Relationship management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">Client details used by event profiles.</p>
        </div>
        <Link href="/dashboard/clients/new" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600">
          <Plus className="size-4" />Add client
        </Link>
      </div>
      <section aria-label="Client records" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-sm font-medium text-slate-600"><UsersRound className="size-4 text-orange-500" />{clients.length} {clients.length === 1 ? "client" : "clients"}</div>
        {clients.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <UsersRound className="mx-auto size-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">No clients yet</p>
            <p className="mt-1 text-sm text-slate-500">Add a client profile to use in event records.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {clients.map((client) => {
              const photo = client.photoStorageKey
                ? `/plan/api/client-photos/${client.photoStorageKey}`
                : client.photoUrl;

              return (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="flex flex-col gap-3 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                  {photo ? (
                    <img src={photo} alt={`${client.name} profile`} width={48} height={48} className="size-12 shrink-0 rounded-xl border border-slate-200 object-cover" />
                  ) : (
                    <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-orange-50 font-semibold text-orange-700">{client.name.slice(0, 1).toUpperCase()}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-3">
                      <span className="font-semibold text-slate-900">{client.name}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600">{client.role}</span>
                      {client.persons.slice(0, 3).map((person) => {
                        const personPhoto = person.photoStorageKey
                          ? `/plan/api/client-photos/${person.photoStorageKey}`
                          : person.photoUrl;

                        return (
                          <span key={person.id} className="inline-flex min-w-0 max-w-[260px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-2">
                            {personPhoto ? (
                              <img src={personPhoto} alt={`${person.name} profile`} width={48} height={48} className="size-12 shrink-0 rounded-xl border border-slate-200 object-cover" />
                            ) : (
                              <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-orange-50 text-sm font-semibold text-orange-700">{person.name.slice(0, 1).toUpperCase()}</span>
                            )}
                            <span className="min-w-0">
                              <span className="flex min-w-0 items-center gap-2">
                                <span className="truncate text-sm font-semibold text-slate-900">{person.name}</span>
                                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] capitalize text-slate-500">{person.role}</span>
                              </span>
                              <span className="mt-1 block truncate text-xs text-slate-500">{person.email || "No email"}</span>
                            </span>
                          </span>
                        );
                      })}
                    </span>
                    <span className="mt-1 block truncate text-sm text-slate-500">{client.email}</span>
                  </span>
                  <span className="text-sm text-slate-500">{client.phone ? `${client.phone} · ${client.phoneType || "phone"}` : "No phone"}</span>
                  <span className="text-sm text-slate-500">{[client.city, client.state].filter(Boolean).join(", ") || "No mailing address"}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
