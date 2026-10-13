"use server";

import { z } from "zod";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSettingsOrganizationId } from "@/lib/settings-organization";
import { removeVenueFile } from "@/lib/venue-file-storage";
import { venueTimezone } from "@/lib/venue-timezone";
import { validTimezone } from "@/lib/event-time";
import { eventReturnQuery } from "@/lib/event-return-query";
import { DEFAULT_PHONE_COUNTRY, formatPhone, isCountryCode } from "@/lib/phone";

const text = z.string().trim().max(10000);
const venueInput = z.object({
  venueId: z.string().trim().max(128),
  name: z.string().trim().min(1).max(200),
  address: text,
  address2: text,
  city: z.string().trim().max(120),
  state: z.string().trim().max(120),
  postalCode: z.string().trim().max(32),
  country: z.string().trim().max(120),
  timezone: z.string().trim().refine((value) => !value || validTimezone(value)),
  telephone: z.string().trim().max(80),
  telephoneCountry: z.string().trim().max(8),
  faxPhone: z.string().trim().max(80),
  faxPhoneCountry: z.string().trim().max(8),
  cellPhone: z.string().trim().max(80),
  cellPhoneCountry: z.string().trim().max(8),
  email: z.string().trim().max(1000),
  website: z.string().trim().max(2048),
  manager: z.string().trim().max(200),
  directions: text,
  comments: text,
  xmlInfo: text,
  category: z.string().trim().max(160),
  distance: z.string().trim().max(80),
  travelTime: z.string().trim().max(80),
  travelFee: z.string().trim().max(80),
  setupFee: z.string().trim().max(80),
  taxRate: z.string().trim().max(80),
  profileImageUrl: z.string().trim().max(2048),
  capacity: z.string().trim().regex(/^\d*$/),
  hourlyRate: z.string().trim().regex(/^(?:\d+(?:\.\d{1,2})?)?$/),
  status: z.string().trim().min(1).max(40),
  features: text,
  contact1Name: z.string().trim().max(200), contact1Phone: z.string().trim().max(80), contact1Country: z.string().trim().max(8), contact1Email: z.string().trim().max(254), contact1Position: z.string().trim().max(160), contact1Notes: text,
  contact2Name: z.string().trim().max(200), contact2Phone: z.string().trim().max(80), contact2Country: z.string().trim().max(8), contact2Email: z.string().trim().max(254), contact2Position: z.string().trim().max(160), contact2Notes: text,
  contact3Name: z.string().trim().max(200), contact3Phone: z.string().trim().max(80), contact3Country: z.string().trim().max(8), contact3Email: z.string().trim().max(254), contact3Position: z.string().trim().max(160), contact3Notes: text,
  contact4Name: z.string().trim().max(200), contact4Phone: z.string().trim().max(80), contact4Country: z.string().trim().max(8), contact4Email: z.string().trim().max(254), contact4Position: z.string().trim().max(160), contact4Notes: text,
  contact5Name: z.string().trim().max(200), contact5Phone: z.string().trim().max(80), contact5Country: z.string().trim().max(8), contact5Email: z.string().trim().max(254), contact5Position: z.string().trim().max(160), contact5Notes: text,
});

function phoneValue(country: string | undefined, number: string) {
  const code = isCountryCode(country) ? country.toUpperCase() : DEFAULT_PHONE_COUNTRY;
  return { number: formatPhone(number, code), country: code };
}

function optionalUrl(value: string) {
  if (!value) return true;
  try {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

function optional(value: string) {
  return value || null;
}

function venueContactData(input: z.infer<typeof venueInput>) {
  return Array.from({ length: 5 }, (_, index) => {
    const number = index + 1;
    const name = input[`contact${number}Name` as keyof typeof input] as string;
    const phone = input[`contact${number}Phone` as keyof typeof input] as string;
    const phoneCountry = input[`contact${number}Country` as keyof typeof input] as string;
    const email = input[`contact${number}Email` as keyof typeof input] as string;
    const position = input[`contact${number}Position` as keyof typeof input] as string;
    const notes = input[`contact${number}Notes` as keyof typeof input] as string;
    if (![name, phone, email, position, notes].some(Boolean)) return null;
    const normalized = phone ? phoneValue(phoneCountry, phone) : null;
    return { name: name || `Contact ${number}`, phone: normalized?.number ?? null, phoneCountry: normalized?.country ?? DEFAULT_PHONE_COUNTRY, email: optional(email), position: optional(position), notes: optional(notes), sortOrder: index };
  }).filter((contact) => contact !== null);
}

export async function saveVenue(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/");

  const result = venueInput.safeParse(Object.fromEntries(formData.entries()));
  const venueId = String(formData.get("venueId") ?? "").trim();
  const errorPath = venueId ? `/dashboard/venues/${venueId}` : "/dashboard/venues/new";
  if (!result.success) redirect(`${errorPath}?error=invalid`);

  const input = result.data;
  if (!optionalUrl(input.website) || !optionalUrl(input.profileImageUrl)) {
    redirect(`${errorPath}?error=url`);
  }

  const contacts = venueContactData(input);
  const telephone = input.telephone ? phoneValue(input.telephoneCountry, input.telephone) : null;
  const faxPhone = input.faxPhone ? phoneValue(input.faxPhoneCountry, input.faxPhone) : null;
  const cellPhone = input.cellPhone ? phoneValue(input.cellPhoneCountry, input.cellPhone) : null;
  const data = {
    name: input.name,
    address: optional(input.address),
    address2: optional(input.address2),
    city: optional(input.city),
    state: optional(input.state),
    postalCode: optional(input.postalCode),
    country: optional(input.country),
    timezone: input.timezone || await venueTimezone(input.postalCode, input.country),
    telephone: telephone?.number ?? null,
    telephoneCountry: telephone?.country ?? DEFAULT_PHONE_COUNTRY,
    faxPhone: faxPhone?.number ?? null,
    faxPhoneCountry: faxPhone?.country ?? DEFAULT_PHONE_COUNTRY,
    cellPhone: cellPhone?.number ?? null,
    cellPhoneCountry: cellPhone?.country ?? DEFAULT_PHONE_COUNTRY,
    email: optional(input.email),
    website: optional(input.website),
    manager: optional(input.manager),
    directions: optional(input.directions),
    comments: optional(input.comments),
    xmlInfo: optional(input.xmlInfo),
    category: optional(input.category),
    distance: optional(input.distance),
    travelTime: optional(input.travelTime),
    travelFee: optional(input.travelFee),
    setupFee: optional(input.setupFee),
    taxRate: optional(input.taxRate),
    profileImageUrl: optional(input.profileImageUrl),
    needsApproval: formData.get("needsApproval") === "on",
    excludeFromInfoForm: formData.get("excludeFromInfoForm") === "on",
    oneTimeVenue: formData.get("oneTimeVenue") === "on",
    capacity: input.capacity ? Number(input.capacity) : null,
    hourlyRate: input.hourlyRate || null,
    status: input.status,
    features: input.features.split(",").map((feature) => feature.trim()).filter(Boolean).slice(0, 50),
  };

  if (venueId) {
    const existing = await prisma.venue.findFirst({
      where: { id: venueId, ...(session.user.organizationId ? { organizationId: session.user.organizationId } : {}) },
      select: { id: true },
    });
    if (!existing) notFound();
    await prisma.venue.update({
      where: { id: venueId },
      data: { ...data, contacts: { deleteMany: {}, create: contacts } },
    });
  } else {
    const organizationId = await getSettingsOrganizationId(session.user.organizationId);
    const venue = await prisma.venue.create({
      data: { ...data, organizationId, contacts: { create: contacts } },
      select: { id: true },
    });
    revalidatePath("/dashboard/venues");
    redirect(`/dashboard/venues/${venue.id}?saved=1`);
  }

  revalidatePath("/dashboard/venues");
  revalidatePath(`/dashboard/venues/${venueId}`);
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/venues/${venueId}?saved=1${eventReturnQuery(formData.get("eventContextId"))}`);
}

export async function deleteVenue(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/");

  const venueId = String(formData.get("venueId") ?? "").trim();
  if (!venueId || String(formData.get("confirmation") ?? "").trim().toLowerCase() !== "delete") {
    redirect(`/dashboard/venues/${venueId}?error=delete-confirmation`);
  }

  const venue = await prisma.venue.findFirst({
    where: { id: venueId, ...(session.user.organizationId ? { organizationId: session.user.organizationId } : {}) },
    select: { id: true, files: { select: { storageKey: true, mimeType: true } } },
  });
  if (!venue) notFound();

  await prisma.venue.delete({ where: { id: venueId } });
  await Promise.all(venue.files.map((file) => removeVenueFile(file.storageKey, file.mimeType)));
  revalidatePath("/dashboard/venues");
  redirect("/dashboard/venues?deleted=1");
}
