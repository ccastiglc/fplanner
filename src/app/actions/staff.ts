"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { eventAccess } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";
import { getSettingsOrganizationId } from "@/lib/settings-organization";
import { eventReturnQuery } from "@/lib/event-return-query";
import { DEFAULT_PHONE_COUNTRY, formatPhone, isCountryCode } from "@/lib/phone";

const schema = z.object({ staffId: z.string().max(128), name: z.string().trim().min(1).max(160), email: z.string().trim().email().or(z.literal("")), phone: z.string().trim().max(80), phoneCountry: z.string().trim().max(8), specialty: z.string().trim().max(120), status: z.string().trim().max(80), notes: z.string().trim().max(10000), hourlyRate: z.string().trim().regex(/^\d{1,10}(?:\.\d{1,2})?$|^$/) });

export async function saveStaff(formData: FormData) {
  const { user } = await eventAccess(true);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  const staffId = String(formData.get("staffId") ?? "");
  if (!parsed.success) redirect(`/dashboard/staff/${staffId || "new"}?error=invalid`);
  const input = parsed.data;
  const existing = staffId ? await prisma.staff.findFirst({ where: { id: staffId, ...(user.organizationId ? { organizationId: user.organizationId } : {}) } }) : null;
  if (staffId && !existing) notFound();
  const phoneCountry = isCountryCode(input.phoneCountry) ? input.phoneCountry.toUpperCase() : DEFAULT_PHONE_COUNTRY;
  const data = { name: input.name, email: input.email || null, phone: input.phone ? formatPhone(input.phone, phoneCountry) : null, phoneCountry, specialty: input.specialty || "dj", status: input.status || "available", hourlyRate: input.hourlyRate || "0", notes: input.notes || null };
  const saved = existing ? await prisma.staff.update({ where: { id: existing.id }, data }) : await prisma.staff.create({ data: { ...data, organizationId: await getSettingsOrganizationId(user.organizationId) } });
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/staff/${saved.id}?saved=1${eventReturnQuery(formData.get("eventContextId"))}`);
}
