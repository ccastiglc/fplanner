import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { Plus, Search, Users } from "lucide-react";
import { eventAccess } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";
import AlphabetIndex from "@/components/dashboard/alphabet-index";

const ALPHABET = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];

function firstLetter(name: string) {
  const letter = name.trim().slice(0, 1).toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : "#";
}

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ user }, query] = await Promise.all([eventAccess(true), searchParams]);
  const term = (query.q ?? "").trim().slice(0, 120);
  const contains = { contains: term, mode: "insensitive" as const };
  const staff = await prisma.staff.findMany({
    where: {
      ...(user.organizationId ? { organizationId: user.organizationId } : {}),
      ...(term ? { OR: [{ name: contains }, { email: contains }, { phone: contains }, { specialty: contains }, { status: contains }] } : {}),
    },
    orderBy: { name: "asc" },
  });

  const groups = new Map<string, typeof staff>();
  for (const person of staff) {
    const letter = firstLetter(person.name);
    groups.set(letter, [...(groups.get(letter) ?? []), person]);
  }
  const presentLetters = new Set(groups.keys());

  return (
    <div className="record-directory">
      <PageHeader title="Staff" eyebrow="Team management" description="Staff profiles used by event assignments.">
        {user.role === "ADMIN" && <Link href="/dashboard/staff/new" className="ui-button ui-button-primary"><Plus aria-hidden="true" className="size-4" />Add staff</Link>}
      </PageHeader>
      <form method="get" className="record-toolbar">
        <label className="record-search">
          <Search aria-hidden="true" />
          <input name="q" type="search" aria-label="Search staff" maxLength={120} defaultValue={term} placeholder="Search names, emails, phones, or specialties" className="ui-input" />
        </label>
        <button type="submit" className="ui-button">Search staff</button>
        {term && <Link href="/dashboard/staff" className="ui-button">Clear</Link>}
      </form>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_56px]">
        <section aria-label="Staff records" className="record-list ui-surface">
          <div className="record-results-heading"><Users aria-hidden="true" />{staff.length} {staff.length === 1 ? "staff member" : "staff members"}{term ? ` matching “${term}”` : ""}</div>
          {staff.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Users aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">{term ? "No matching staff" : "No staff yet"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{term ? "Try a different name, email, phone, or specialty." : "Add a staff profile to use in event assignments."}</p>
            </div>
          ) : (
            <div>
              {ALPHABET.filter((letter) => groups.has(letter)).map((letter) => (
                <section key={letter} id={`staff-${letter}`} className="scroll-mt-28">
                  <h2 className="record-group-label">{letter}</h2>
                  <div>
                    {groups.get(letter)?.map((person) => (
                      <Link key={person.id} href={`/dashboard/staff/${person.id}`} className="record-row">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium text-foreground">{person.name}</h3>
                            <span className={`ui-badge capitalize ${person.status === "active" ? "record-status-active" : ""}`}>{person.status}</span>
                          </div>
                          <p className="mt-1.5 text-sm text-muted-foreground">{person.specialty || "No specialty recorded"}</p>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground lg:justify-end">
                          <span>{person.email || "No email"}</span>
                          <span>{person.phone || "No phone"}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
        <AlphabetIndex prefix="staff" letters={presentLetters} />
      </div>
    </div>
  );
}
