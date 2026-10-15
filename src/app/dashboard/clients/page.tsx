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
    <div className="record-directory">
      <PageHeader title="Clients" eyebrow="Relationship management" description="Client details used by event profiles.">
        <Link href="/dashboard/clients/new" className="ui-button ui-button-primary"><Plus aria-hidden="true" className="size-4" />Add client</Link>
      </PageHeader>
      <form method="get" className="record-toolbar">
        <label className="record-search">
          <Search aria-hidden="true" />
          <input name="q" type="search" aria-label="Search clients" maxLength={120} defaultValue={term} placeholder="Search names, emails, phones, or addresses" className="ui-input" />
        </label>
        <button type="submit" className="ui-button">Search clients</button>
        {term && <Link href="/dashboard/clients" className="ui-button">Clear</Link>}
      </form>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_56px]">
        <section aria-label="Client records" className="record-list ui-surface">
          <div className="record-results-heading"><UsersRound aria-hidden="true" />{clients.length} {clients.length === 1 ? "client" : "clients"}{term ? ` matching “${term}”` : ""}</div>
          {clients.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <UsersRound aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">{term ? "No matching clients" : "No clients yet"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{term ? "Try a different name, email, phone, or address." : "Add a client profile to use in event records."}</p>
            </div>
          ) : (
            <div>
              {ALPHABET.filter((letter) => groups.has(letter)).map((letter) => (
                <section key={letter} id={`clients-${letter}`} className="scroll-mt-28">
                  <h2 className="record-group-label">{letter}</h2>
                  <div>
                    {groups.get(letter)?.map((client) => {
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
                        <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="record-row">
                          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                            {people.map((person) => (
                              <span key={person.id} className="record-person">
                                {person.photo ? (
                                  <img src={person.photo} alt={`${person.name} profile`} width={48} height={48} className="size-10 shrink-0 rounded-lg border border-border object-cover" />
                                ) : (
                                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-secondary text-sm font-medium text-foreground">{person.name.slice(0, 1).toUpperCase()}</span>
                                )}
                                <span className="record-person-copy">
                                  <span>
                                    <span className="text-sm font-medium text-foreground">{person.name}</span>
                                    <span className="ui-badge capitalize">{person.role}</span>
                                  </span>
                                  {person.pronunciation && <span className="text-xs italic text-muted-foreground">{person.pronunciation}</span>}
                                  <span className="text-xs text-muted-foreground">{person.email || "No email"}</span>
                                </span>
                              </span>
                            ))}
                          </span>
                          <span className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground lg:ml-auto lg:justify-end">
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
