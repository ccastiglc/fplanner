"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSettingsOrganizationId } from "@/lib/settings-organization";
import { DEFAULT_PHONE_COUNTRY, formatPhone, isCountryCode } from "@/lib/phone";

const optionalHttpsUrl = z.string().trim().max(2048).refine((value) => {
  if (!value) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, "Use an HTTPS URL.").optional();

const businessProfile = z.object({
  businessName: z.string().trim().min(1).max(160),
  businessPhone: z.string().trim().max(40).optional(),
  businessPhoneCountry: z.string().trim().max(8).optional(),
  businessEmail: z.union([z.string().trim().email().max(254), z.literal("")]),
  businessWebsite: optionalHttpsUrl,
  logoUrl: optionalHttpsUrl,
  brandAccentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export async function saveBusinessProfile(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/");

  const result = businessProfile.safeParse(Object.fromEntries(formData.entries()));
  if (!result.success) redirect("/dashboard/settings?error=business-profile#business-profile");

  const organizationId = await getSettingsOrganizationId(session.user.organizationId);
  const input = result.data;
  const businessEmail = input.businessEmail.trim().toLowerCase() || null;
  const businessPhoneCountry = isCountryCode(input.businessPhoneCountry) ? input.businessPhoneCountry.toUpperCase() : DEFAULT_PHONE_COUNTRY;
  const businessPhone = input.businessPhone ? formatPhone(input.businessPhone, businessPhoneCountry) : null;

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: organizationId },
      data: { name: input.businessName },
    }),
    prisma.organizationSettings.upsert({
      where: { organizationId },
      create: {
        organization: { connect: { id: organizationId } },
        businessPhone,
        businessPhoneCountry,
        businessEmail,
        businessWebsite: input.businessWebsite?.trim() || null,
        logoUrl: input.logoUrl?.trim() || null,
        brandAccentColor: input.brandAccentColor.toUpperCase(),
      },
      update: {
        businessPhone,
        businessPhoneCountry,
        businessEmail,
        businessWebsite: input.businessWebsite?.trim() || null,
        logoUrl: input.logoUrl?.trim() || null,
        brandAccentColor: input.brandAccentColor.toUpperCase(),
      },
    }),
  ]);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/settings?saved=business#business-profile");
}
