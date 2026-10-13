import Link from "next/link";
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
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-orange-600">Team management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Staff</h1>
          <p className="mt-1 text-sm text-slate-500">Staff profiles used by event assignments.</p>
        </div>
        {user.role === "ADMIN" && (
          <Link href="/dashboard/staff/new" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-brand-accent-foreground transition hover:bg-orange-600">
            <Plus className="size-4" />Add staff
          </Link>
        )}
      </div>
      <form method="get" className="mb-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 px-2">
          <Search aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
          <input name="q" type="search" maxLength={120} defaultValue={term} placeholder="Search names, emails, phones, or specialties" className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
        </label>
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Search staff</button>
        {term && <Link href="/dashboard/staff" className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-600 hover:bg-slate-50">Clear</Link>}
      </form>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_56px]">
        <section aria-label="Staff records" className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-sm font-medium text-slate-600"><Users className="size-4 text-orange-500" />{staff.length} {staff.length === 1 ? "staff member" : "staff members"}{term ? ` matching “${term}”` : ""}</div>
          {staff.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Users className="mx-auto size-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700">{term ? "No matching staff" : "No staff yet"}</p>
              <p className="mt-1 text-sm text-slate-500">{term ? "Try a different name, email, phone, or specialty." : "Add a staff profile to use in event assignments."}</p>
            </div>
          ) : (
            <div>
              {ALPHABET.filter((letter) => groups.has(letter)).map((letter) => (
                <section key={letter} id={`staff-${letter}`} className="scroll-mt-28">
                  <h2 className="border-b border-slate-100 bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{letter}</h2>
                  <div className="divide-y divide-slate-100">
                    {groups.get(letter)?.map((person, personIndex) => (
                      <Link key={person.id} href={`/dashboard/staff/${person.id}`} className={`flex flex-col gap-4 p-4 transition hover:bg-orange-50/40 sm:px-5 lg:flex-row lg:items-center ${personIndex % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{person.name}</h3>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${person.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{person.status}</span>
                          </div>
                          <p className="mt-1.5 text-sm text-slate-500">{person.specialty || "No specialty recorded"}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500 lg:justify-end">
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
