import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { notFound } from "next/navigation";
import { MapPin, Plus, Search } from "lucide-react";
import { auth } from "@/auth";
import AlphabetIndex from "@/components/dashboard/alphabet-index";
import { prisma } from "@/lib/prisma";

const ALPHABET = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];

function firstLetter(name: string) {
  const letter = name.trim().slice(0, 1).toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : "#";
}

function venueFeatures(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((feature): feature is string => typeof feature === "string").slice(0, 8);
}

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") notFound();

  const { q = "" } = await searchParams;
  const term = q.trim().slice(0, 120);
  const contains = { contains: term, mode: "insensitive" as const };
  const venues = await prisma.venue.findMany({
    where: {
      ...(session.user.organizationId ? { organizationId: session.user.organizationId } : {}),
      ...(term ? {
        OR: [
          { name: contains },
          { address: contains },
          { city: contains },
          { state: contains },
          { postalCode: contains },
          { country: contains },
          { telephone: contains },
          { cellPhone: contains },
          { email: contains },
          { manager: contains },
          { category: contains },
          { status: contains },
        ],
      } : {}),
    },
    orderBy: { name: "asc" },
  });

  const groups = new Map<string, typeof venues>();
  for (const venue of venues) {
    const letter = firstLetter(venue.name);
    groups.set(letter, [...(groups.get(letter) ?? []), venue]);
  }
  const presentLetters = new Set(groups.keys());

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader title="Venues" eyebrow="Relationship management" description="Search, browse, and edit venue profiles.">
        <Link href="/dashboard/venues/new" className="ui-button ui-button-primary"><Plus aria-hidden="true" className="size-4" />Add venue</Link>
      </PageHeader>
      <form method="get" className="mb-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 px-2">
          <Search aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
          <input name="q" type="search" maxLength={120} defaultValue={term} placeholder="Search venue name or address" className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
        </label>
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Search venues</button>
        {term && <a href="/plan/dashboard/venues" className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-600 hover:bg-slate-50">Clear</a>}
      </form>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_56px]">
        <section aria-label="Venue records" className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-sm font-medium text-slate-600"><MapPin className="size-4 text-orange-500" />{venues.length} {venues.length === 1 ? "venue" : "venues"}{term ? ` matching “${term}”` : ""}</div>
          {venues.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <MapPin className="mx-auto size-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700">{term ? "No matching venues" : "No venues yet"}</p>
              <p className="mt-1 text-sm text-slate-500">{term ? "Try a different venue name or detail." : "Add a venue profile or import your DJEP venue CSV."}</p>
            </div>
          ) : (
            <div>
              {ALPHABET.filter((letter) => groups.has(letter)).map((letter) => (
                <section key={letter} id={`venues-${letter}`} className="scroll-mt-28">
                  <h2 className="border-b border-slate-100 bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{letter}</h2>
                  <div className="divide-y divide-slate-100">
                    {groups.get(letter)?.map((venue, venueIndex) => {
                      const features = venueFeatures(venue.features);
                        return (
                          <Link href={`/dashboard/venues/${venue.id}`} key={venue.id} className={`flex flex-col gap-4 p-4 transition hover:bg-orange-50/40 sm:px-5 lg:flex-row lg:items-center ${venueIndex % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-slate-900">{venue.name}</h3>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${venue.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{venue.status}</span>
                            </div>
                            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-slate-500"><MapPin className="size-4 shrink-0" />{[venue.address, venue.city, venue.state, venue.postalCode, venue.country].filter(Boolean).join(", ") || "No address recorded"}</p>
                            {features.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{features.map((feature) => <span key={feature} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{feature}</span>)}</div>}
                          </div>
                          <div className="flex shrink-0 gap-5 text-sm text-slate-500">
                            <span>{venue.capacity ? `${venue.capacity} capacity` : "Capacity not set"}</span>
                            <span>{venue.hourlyRate ? `$${Number(venue.hourlyRate).toFixed(0)}/hr` : "Rate not set"}</span>
                          </div>
                          </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
        <AlphabetIndex prefix="venues" letters={presentLetters} />
      </div>
    </div>
  );
}
