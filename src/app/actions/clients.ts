"use server";

import { z } from "zod";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ClientPhoneNumber, Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { removeClientPhoto } from "@/lib/client-photo-storage";

const optionalText = z.string().trim().max(2000).optional();
const optionalEmail = z.string().trim().max(254).email().or(z.literal(""));
const phoneInput = z.object({
  id: z.string().optional(),
  number: z.string().trim().min(1).max(40),
  type: z.enum(["mobile", "home", "work", "fax", "other"]),
});

const clientInput = z.object({
  name: z.string().trim().min(1).max(160),
  pronunciation: z.string().trim().max(160).optional(),
  role: z.enum(["client", "bride", "groom"]),
  email: optionalEmail,
  address: optionalText,
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(32).optional(),
  country: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(10000).optional(),
  photoUrl: z.string().trim().max(2048).optional(),
});

const personInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(160),
  pronunciation: z.string().trim().max(160).optional(),
  role: z.enum(["client", "bride", "groom"]),
  email: optionalEmail,
  phoneNumbers: z.array(phoneInput).max(8),
  photoUrl: z.string().trim().max(2048).optional(),
});

const additionalContactInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(160),
  pronunciation: z.string().trim().max(160).optional(),
  role: z.string().trim().min(1).max(80),
  phoneNumbers: z.array(phoneInput).max(8),
  email: optionalEmail,
});

function parseArray<T extends z.ZodType>(value: FormDataEntryValue | null, schema: T, max = 100) {
  try {
    return z.array(schema).max(max).safeParse(JSON.parse(String(value ?? "[]")));
  } catch {
    return { success: false as const, error: "Invalid list data" };
  }
}

function validPhotoUrl(value?: string | null) {
  if (!value?.trim()) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function clientPhotoData(value?: string | null) {
  return value?.trim() || null;
}

function personData(person: z.infer<typeof personInput>) {
  const photoUrl = clientPhotoData(person.photoUrl);
  const primaryPhone = person.phoneNumbers[0];
  return {
    name: person.name,
    pronunciation: person.pronunciation?.trim() || null,
    role: person.role,
    email: person.email?.trim() || null,
    phone: primaryPhone?.number ?? null,
    phoneType: primaryPhone?.type ?? "mobile",
    photoUrl,
    ...(photoUrl ? { photoStorageKey: null, photoMimeType: null } : {}),
  };
}

function additionalContactData(contact: z.infer<typeof additionalContactInput>) {
  return {
    name: contact.name,
    pronunciation: contact.pronunciation?.trim() || null,
    role: contact.role,
    phone: contact.phoneNumbers[0]?.number ?? null,
    email: contact.email?.trim() || null,
  };
}

function phoneIdsAreOwned(submitted: z.infer<typeof phoneInput>[], existing: ClientPhoneNumber[]) {
  const ids = submitted.flatMap((phone) => phone.id ? [phone.id] : []);
  return new Set(ids).size === ids.length && ids.every((id) => existing.some((phone) => phone.id === id));
}

async function syncPhoneNumbers(
  transaction: Prisma.TransactionClient,
  owner: { clientId: string } | { personId: string } | { additionalContactId: string },
  existing: ClientPhoneNumber[],
  submitted: z.infer<typeof phoneInput>[]
) {
  const ids = submitted.flatMap((phone) => phone.id ? [phone.id] : []);

  await transaction.clientPhoneNumber.deleteMany({
    where: { ...owner, ...(ids.length ? { id: { notIn: ids } } : {}) },
  });

  for (const phone of submitted) {
    if (phone.id && existing.some((item) => item.id === phone.id)) {
      await transaction.clientPhoneNumber.update({
        where: { id: phone.id },
        data: { number: phone.number, type: phone.type },
      });
    } else if (!phone.id) {
      await transaction.clientPhoneNumber.create({
        data: { ...owner, number: phone.number, type: phone.type },
      });
    }
  }
}

export async function saveClient(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/");

  const clientId = String(formData.get("clientId") ?? "").trim();
  const result = clientInput.safeParse(Object.fromEntries(formData.entries()));
  const clientPhonesResult = parseArray(formData.get("clientPhonesJson"), phoneInput);
  const personsResult = parseArray(formData.get("personsJson"), personInput, 3);
  const contactsResult = parseArray(formData.get("contactsJson"), additionalContactInput);
  const errorPath = clientId ? `/dashboard/clients/${clientId}` : "/dashboard/clients/new";

  if (!result.success || !clientPhonesResult.success || !personsResult.success || !contactsResult.success) {
    redirect(`${errorPath}?error=invalid`);
  }

  const input = result.data;
  const photoUrl = input.photoUrl?.trim() || null;

  if (
    !validPhotoUrl(photoUrl) ||
    personsResult.data.some((person) => !validPhotoUrl(person.photoUrl))
  ) {
    redirect(`${errorPath}?error=photo-url`);
  }

  const persons = personsResult.data;
  const contacts = contactsResult.data;
  const clientPhones = clientPhonesResult.data;

  const data = {
    name: input.name,
    pronunciation: input.pronunciation?.trim() || null,
    contactName: input.name,
    role: input.role,
    email: input.email?.trim().toLowerCase() || null,
    phone: clientPhones[0]?.number ?? null,
    phoneType: clientPhones[0]?.type ?? "mobile",
    address: input.address?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    postalCode: input.postalCode?.trim() || null,
    country: input.country?.trim() || null,
    notes: input.notes?.trim() || null,
    photoUrl,
  };

  if (!clientId) {
    const organizationId = session.user.organizationId ?? (await prisma.organization.upsert({
      where: { slug: "fredo-productions" },
      create: { name: "Fredo Productions", slug: "fredo-productions" },
      update: {},
    })).id;

    const client = await prisma.client.create({
      data: {
        ...data,
        organization: { connect: { id: organizationId } },
        phoneNumbers: { create: clientPhones.map(({ number, type }) => ({ number, type })) },
        persons: {
          create: persons.map((person) => ({
            ...personData(person),
            phoneNumbers: { create: person.phoneNumbers.map(({ number, type }) => ({ number, type })) },
          })),
        },
        additionalContacts: {
          create: contacts.map((contact) => ({
            ...additionalContactData(contact),
            phoneNumbers: { create: contact.phoneNumbers.map(({ number, type }) => ({ number, type })) },
          })),
        },
      },
    });
    revalidatePath("/dashboard/clients");
    redirect(`/dashboard/clients/${client.id}`);
  }

  const existing = await prisma.client.findFirst({
    where: {
      id: clientId,
      ...(session.user.organizationId ? { organizationId: session.user.organizationId } : {}),
    },
    include: {
      phoneNumbers: true,
      persons: { include: { phoneNumbers: true } },
      additionalContacts: { include: { phoneNumbers: true } },
    },
  });
  if (!existing) notFound();

  const personIds = persons.flatMap((person) => person.id ? [person.id] : []);
  const contactIds = contacts.flatMap((contact) => contact.id ? [contact.id] : []);
  const existingPersonIds = new Set(existing.persons.map((person) => person.id));
  const existingContactIds = new Set(existing.additionalContacts.map((contact) => contact.id));

  if (
    !phoneIdsAreOwned(clientPhones, existing.phoneNumbers) ||
    persons.some((person) => {
      const oldPerson = existing.persons.find((item) => item.id === person.id);
      return person.id ? !oldPerson || !phoneIdsAreOwned(person.phoneNumbers, oldPerson.phoneNumbers) : person.phoneNumbers.some((phone) => phone.id);
    }) ||
    contacts.some((contact) => {
      const oldContact = existing.additionalContacts.find((item) => item.id === contact.id);
      return contact.id ? !oldContact || !phoneIdsAreOwned(contact.phoneNumbers, oldContact.phoneNumbers) : contact.phoneNumbers.some((phone) => phone.id);
    }) ||
    personIds.some((id) => !existingPersonIds.has(id)) ||
    contactIds.some((id) => !existingContactIds.has(id))
  ) {
    notFound();
  }

  const removedPersons = existing.persons.filter((person) => !personIds.includes(person.id));
  const photosToRemove = [
    ...removedPersons,
    ...existing.persons.filter((person) => {
      const updated = persons.find((item) => item.id === person.id);
      return updated?.photoUrl?.trim() && person.photoStorageKey;
    }),
  ].flatMap((person) => person.photoStorageKey && person.photoMimeType
    ? [{ key: person.photoStorageKey, mimeType: person.photoMimeType }]
    : []);

  await prisma.$transaction(async (transaction) => {
    await transaction.client.update({
      where: { id: clientId },
      data: {
        ...data,
        photoStorageKey: photoUrl ? null : existing.photoStorageKey,
        photoMimeType: photoUrl ? null : existing.photoMimeType,
      },
    });
    await syncPhoneNumbers(transaction, { clientId }, existing.phoneNumbers, clientPhones);

    await transaction.clientPerson.deleteMany({
      where: {
        clientId,
        ...(personIds.length ? { id: { notIn: personIds } } : {}),
      },
    });

    for (const person of persons) {
      if (person.id) {
        await transaction.clientPerson.update({
          where: { id: person.id },
          data: personData(person),
        });
        const oldPerson = existing.persons.find((item) => item.id === person.id);
        if (oldPerson) {
          await syncPhoneNumbers(transaction, { personId: person.id }, oldPerson.phoneNumbers, person.phoneNumbers);
        }
      } else {
        const created = await transaction.clientPerson.create({
          data: { ...personData(person), clientId },
        });
        await syncPhoneNumbers(transaction, { personId: created.id }, [], person.phoneNumbers);
      }
    }

    await transaction.clientAdditionalContact.deleteMany({
      where: {
        clientId,
        ...(contactIds.length ? { id: { notIn: contactIds } } : {}),
      },
    });

    for (const contact of contacts) {
      if (contact.id) {
        await transaction.clientAdditionalContact.update({
          where: { id: contact.id },
          data: additionalContactData(contact),
        });
        const oldContact = existing.additionalContacts.find((item) => item.id === contact.id);
        if (oldContact) {
          await syncPhoneNumbers(transaction, { additionalContactId: contact.id }, oldContact.phoneNumbers, contact.phoneNumbers);
        }
      } else {
        const created = await transaction.clientAdditionalContact.create({
          data: { ...additionalContactData(contact), clientId },
        });
        await syncPhoneNumbers(transaction, { additionalContactId: created.id }, [], contact.phoneNumbers);
      }
    }
  });

  if (photoUrl && existing.photoStorageKey && existing.photoMimeType) {
    photosToRemove.push({ key: existing.photoStorageKey, mimeType: existing.photoMimeType });
  }

  await Promise.all(photosToRemove.map((photo) => removeClientPhoto(photo.key, photo.mimeType)));

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  redirect(`/dashboard/clients/${clientId}?saved=1`);
}

export async function deleteClient(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/");

  const clientId = String(formData.get("clientId") ?? "").trim();
  const confirmation = String(formData.get("confirmation") ?? "").trim().toLowerCase();
  if (!clientId || confirmation !== "delete") {
    redirect(`/dashboard/clients/${clientId}?error=delete-confirmation`);
  }

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      ...(session.user.organizationId ? { organizationId: session.user.organizationId } : {}),
    },
    include: { persons: true },
  });
  if (!client) notFound();

  await prisma.client.delete({ where: { id: client.id } });

  const storedPhotos = [
    ...(client.photoStorageKey && client.photoMimeType
      ? [{ key: client.photoStorageKey, mimeType: client.photoMimeType }]
      : []),
    ...client.persons.flatMap((person) => person.photoStorageKey && person.photoMimeType
      ? [{ key: person.photoStorageKey, mimeType: person.photoMimeType }]
      : []),
  ];

  await Promise.all(storedPhotos.map((photo) => removeClientPhoto(photo.key, photo.mimeType)));
  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients?deleted=1");
}
