import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureClientPhotoDirectory, getClientPhotoPath, removeClientPhoto } from "@/lib/client-photo-storage";

const maxPhotoSize = 5 * 1024 * 1024;

function detectImage(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return "image/png";
  }

  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }

  return null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { clientId } = await params;
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      ...(session.user.organizationId ? { organizationId: session.user.organizationId } : {}),
    },
  });
  if (!client) return Response.json({ error: "Client not found" }, { status: 404 });

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxPhotoSize + 128 * 1024) {
    return Response.json({ error: "Photo exceeds the 5 MB limit" }, { status: 413 });
  }

  const formData = await request.formData();
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return Response.json({ error: "Select an image to upload" }, { status: 400 });
  }
  if (photo.size > maxPhotoSize) {
    return Response.json({ error: "Photo exceeds the 5 MB limit" }, { status: 413 });
  }

  const buffer = Buffer.from(await photo.arrayBuffer());
  const mimeType = detectImage(buffer);
  if (!mimeType) {
    return Response.json({ error: "Upload a JPEG, PNG, or WebP image" }, { status: 415 });
  }

  const storageKey = randomUUID();
  const filePath = getClientPhotoPath(storageKey, mimeType);
  if (!filePath) return Response.json({ error: "Invalid image type" }, { status: 415 });

  await ensureClientPhotoDirectory();
  await writeFile(filePath, buffer, { flag: "wx", mode: 0o600 });

  try {
    await prisma.client.update({
      where: { id: client.id },
      data: { photoUrl: null, photoStorageKey: storageKey, photoMimeType: mimeType },
    });
  } catch (error) {
    await removeClientPhoto(storageKey, mimeType);
    throw error;
  }

  if (client.photoStorageKey && client.photoMimeType) {
    await removeClientPhoto(client.photoStorageKey, client.photoMimeType);
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${client.id}`);
  return Response.json({ photoStorageKey: storageKey });
}
