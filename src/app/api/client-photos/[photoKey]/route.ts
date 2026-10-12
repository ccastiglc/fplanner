import { readFile } from "node:fs/promises";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClientPhotoPath } from "@/lib/client-photo-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ photoKey: string }> }
) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return new Response(null, { status: 404 });

  const { photoKey } = await params;
  const organizationFilter = session.user.organizationId
    ? { organizationId: session.user.organizationId }
    : {};
  const [clientPhoto, personPhoto] = await Promise.all([
    prisma.client.findFirst({
      where: { photoStorageKey: photoKey, ...organizationFilter },
      select: { photoStorageKey: true, photoMimeType: true },
    }),
    prisma.clientPerson.findFirst({
      where: {
        photoStorageKey: photoKey,
        ...(session.user.organizationId
          ? { client: { is: { organizationId: session.user.organizationId } } }
          : {}),
      },
      select: { photoStorageKey: true, photoMimeType: true },
    }),
  ]);
  const photoRecord = clientPhoto ?? personPhoto;

  if (!photoRecord?.photoStorageKey || !photoRecord.photoMimeType) {
    return new Response(null, { status: 404 });
  }

  const filePath = getClientPhotoPath(photoRecord.photoStorageKey, photoRecord.photoMimeType);
  if (!filePath) return new Response(null, { status: 404 });

  try {
    const photo = await readFile(filePath);
    return new Response(photo, {
      headers: {
        "Content-Type": photoRecord.photoMimeType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
