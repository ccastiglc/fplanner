"use server";

import { z } from "zod";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { removeClientPhoto } from "@/lib/client-photo-storage";

const optionalText = z.string().trim().max(2000).optional();

const clientInput = z.object({
  name: z.string().trim().min(1).max(160),
  role: z.enum(["client", "bride", "groom"]),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional(),
  phoneType: z.enum(["mobile", "home", "work", "fax", "other"]),
  address: optionalText,
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(32).optional(),
  country: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(10000).optional(),
  photoUrl: z.string().trim().max(2048).optional(),
});

export async function saveClient(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/");

  const clientId = String(formData.get("clientId") ?? "").trim();
  const result = clientInput.safeParse(Object.fromEntries(formData.entries()));
  const errorPath = clientId ? `/dashboard/clients/${clientId}` : "/dashboard/clients/new";

  if (!result.success) redirect(`${errorPath}?error=invalid`);

  const input = result.data;
  const photoUrl = input.photoUrl?.trim() || null;

  if (photoUrl) {
    let protocol = "";
    try {
      protocol = new URL(photoUrl).protocol;
    } catch {
      redirect(`${errorPath}?error=photo-url`);
    }
    if (protocol !== "https:") redirect(`${errorPath}?error=photo-url`);
  }

  const data = {
    name: input.name,
    contactName: input.name,
    role: input.role,
    email: input.email.toLowerCase(),
    phone: input.phone?.trim() || null,
    phoneType: input.phoneType,
    address: input.address?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    postalCode: input.postalCode?.trim() || null,
    country: input.country?.trim() || null,
    notes: input.notes?.trim() || null,
    photoUrl,
  };

  const organizationId = session.user.organizationId ?? (await prisma.organization.upsert({
    where: { slug: "fredo-productions" },
    create: { name: "Fredo Productions", slug: "fredo-productions" },
    update: {},
  })).id;

  if (!clientId) {
    const client = await prisma.client.create({
      data: { ...data, organization: { connect: { id: organizationId } } },
    });
    revalidatePath("/dashboard/clients");
    redirect(`/dashboard/clients/${client.id}`);
  }

  const existing = await prisma.client.findFirst({
    where: {
      id: clientId,
      ...(session.user.organizationId ? { organizationId: session.user.organizationId } : {}),
    },
  });
  if (!existing) notFound();

  await prisma.client.update({
    where: { id: clientId },
    data: {
      ...data,
      photoStorageKey: photoUrl ? null : existing.photoStorageKey,
      photoMimeType: photoUrl ? null : existing.photoMimeType,
    },
  });

  if (photoUrl && existing.photoStorageKey && existing.photoMimeType) {
    await removeClientPhoto(existing.photoStorageKey, existing.photoMimeType);
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  redirect(`/dashboard/clients/${clientId}?saved=1`);
}
