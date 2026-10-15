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
    <div className="record-directory">
      <PageHeader title="Venues" eyebrow="Relationship management" description="Search, browse, and edit venue profiles.">
        <Link href="/dashboard/venues/new" className="ui-button ui-button-primary"><Plus aria-hidden="true" className="size-4" />Add venue</Link>
      </PageHeader>
      <form method="get" className="record-toolbar">
        <label className="record-search">
          <Search aria-hidden="true" />
          <input name="q" type="search" aria-label="Search venues" maxLength={120} defaultValue={term} placeholder="Search venue name or address" className="ui-input" />
        </label>
        <button type="submit" className="ui-button">Search venues</button>
        {term && <a href="/plan/dashboard/venues" className="ui-button">Clear</a>}
      </form>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_56px]">
        <section aria-label="Venue records" className="record-list ui-surface">
          <div className="record-results-heading"><MapPin aria-hidden="true" />{venues.length} {venues.length === 1 ? "venue" : "venues"}{term ? ` matching “${term}”` : ""}</div>
          {venues.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <MapPin aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">{term ? "No matching venues" : "No venues yet"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{term ? "Try a different venue name or detail." : "Add a venue profile or import your DJEP venue CSV."}</p>
            </div>
          ) : (
            <div>
              {ALPHABET.filter((letter) => groups.has(letter)).map((letter) => (
                <section key={letter} id={`venues-${letter}`} className="scroll-mt-28">
                  <h2 className="record-group-label">{letter}</h2>
                  <div>
                    {groups.get(letter)?.map((venue) => {
                      const features = venueFeatures(venue.features);
                        return (
                          <Link href={`/dashboard/venues/${venue.id}`} key={venue.id} className="record-row">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-medium text-foreground">{venue.name}</h3>
                              <span className={`ui-badge capitalize ${venue.status === "active" ? "record-status-active" : ""}`}>{venue.status}</span>
                            </div>
                            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"><MapPin aria-hidden="true" className="size-4 shrink-0" />{[venue.address, venue.city, venue.state, venue.postalCode, venue.country].filter(Boolean).join(", ") || "No address recorded"}</p>
                            {features.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{features.map((feature) => <span key={feature} className="ui-badge">{feature}</span>)}</div>}
                          </div>
                          <div className="flex flex-wrap gap-5 text-sm tabular-nums text-muted-foreground">
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
