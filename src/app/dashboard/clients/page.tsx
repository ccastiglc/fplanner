import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { notFound } from "next/navigation";
import { Plus, Search, UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AlphabetIndex from "@/components/dashboard/alphabet-index";

const ALPHABET = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];

function firstLetter(name: string) {
  const letter = name.trim().slice(0, 1).toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : "#";
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") notFound();

  const { q = "" } = await searchParams;
  const term = q.trim().slice(0, 120);
  const contains = { contains: term, mode: "insensitive" as const };
  const clients = await prisma.client.findMany({
    where: {
      ...(session.user.organizationId ? { organizationId: session.user.organizationId } : {}),
      ...(term ? {
        OR: [
          { name: contains },
          { email: contains },
          { phone: contains },
          { address: contains },
          { city: contains },
          { state: contains },
          { persons: { some: { OR: [{ name: contains }, { email: contains }, { phone: contains }] } } },
          { additionalContacts: { some: { OR: [{ name: contains }, { role: contains }, { email: contains }, { phone: contains }] } } },
        ],
      } : {}),
    },
    include: {
      persons: {
        select: { id: true, name: true, pronunciation: true, role: true, email: true, photoUrl: true, photoStorageKey: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const groups = new Map<string, typeof clients>();
  for (const client of clients) {
    const letter = firstLetter(client.name);
    groups.set(letter, [...(groups.get(letter) ?? []), client]);
  }
  const presentLetters = new Set(groups.keys());

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader title="Clients" eyebrow="Relationship management" description="Client details used by event profiles.">
        <Link href="/dashboard/clients/new" className="ui-button ui-button-primary"><Plus aria-hidden="true" className="size-4" />Add client</Link>
      </PageHeader>
      <form method="get" className="mb-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 px-2">
          <Search aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
          <input name="q" type="search" maxLength={120} defaultValue={term} placeholder="Search names, emails, phones, or addresses" className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
        </label>
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Search clients</button>
        {term && <Link href="/dashboard/clients" className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-600 hover:bg-slate-50">Clear</Link>}
      </form>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_56px]">
        <section aria-label="Client records" className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-sm font-medium text-slate-600"><UsersRound className="size-4 text-orange-500" />{clients.length} {clients.length === 1 ? "client" : "clients"}{term ? ` matching “${term}”` : ""}</div>
          {clients.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <UsersRound className="mx-auto size-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700">{term ? "No matching clients" : "No clients yet"}</p>
              <p className="mt-1 text-sm text-slate-500">{term ? "Try a different name, email, phone, or address." : "Add a client profile to use in event records."}</p>
            </div>
          ) : (
            <div>
              {ALPHABET.filter((letter) => groups.has(letter)).map((letter) => (
                <section key={letter} id={`clients-${letter}`} className="scroll-mt-28">
                  <h2 className="border-b border-slate-100 bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{letter}</h2>
                  <div className="divide-y divide-slate-100">
                    {groups.get(letter)?.map((client, clientIndex) => {
                      const people = [
                        {
                          id: `primary-${client.id}`,
                          name: client.name,
                          pronunciation: client.pronunciation,
                          role: client.role,
                          email: client.email,
                          photo: client.photoStorageKey ? `/plan/api/client-photos/${client.photoStorageKey}` : client.photoUrl,
                        },
                        ...client.persons.slice(0, 3).map((person) => ({
                          id: person.id,
                          name: person.name,
                          pronunciation: person.pronunciation,
                          role: person.role,
                          email: person.email,
                          photo: person.photoStorageKey ? `/plan/api/client-photos/${person.photoStorageKey}` : person.photoUrl,
                        })),
                      ];

                      return (
                        <Link key={client.id} href={`/dashboard/clients/${client.id}`} className={`flex flex-col gap-4 p-4 transition hover:bg-orange-50/40 sm:px-5 lg:flex-row lg:items-center ${clientIndex % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}>
                          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                            {people.map((person) => (
                              <span key={person.id} className="inline-flex min-w-0 max-w-[260px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-2">
                                {person.photo ? (
                                  <img src={person.photo} alt={`${person.name} profile`} width={48} height={48} className="size-12 shrink-0 rounded-xl border border-slate-200 object-cover" />
                                ) : (
                                  <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-orange-50 text-sm font-semibold text-orange-700">{person.name.slice(0, 1).toUpperCase()}</span>
                                )}
                                <span className="min-w-0">
                                  <span className="flex min-w-0 items-center gap-2">
                                    <span className="truncate text-sm font-semibold text-slate-900">{person.name}</span>
                                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] capitalize text-slate-500">{person.role}</span>
                                  </span>
                                  {person.pronunciation && <span className="mt-0.5 block truncate text-xs italic text-slate-400">{person.pronunciation}</span>}
                                  <span className="mt-1 block truncate text-xs text-slate-500">{person.email || "No email"}</span>
                                </span>
                              </span>
                            ))}
                          </span>
                          <span className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500 lg:ml-auto lg:justify-end">
                            <span>{client.phone ? `${client.phone} · ${client.phoneType || "phone"}` : "No phone"}</span>
                            <span>{[client.city, client.state].filter(Boolean).join(", ") || "No mailing address"}</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
        <AlphabetIndex prefix="clients" letters={presentLetters} />
      </div>
    </div>
  );
}
