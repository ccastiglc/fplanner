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
  const client = await prisma.client.findFirst({
    where: {
      photoStorageKey: photoKey,
      ...(session.user.organizationId ? { organizationId: session.user.organizationId } : {}),
    },
    select: { photoStorageKey: true, photoMimeType: true },
  });

  if (!client?.photoStorageKey || !client.photoMimeType) {
    return new Response(null, { status: 404 });
  }

  const filePath = getClientPhotoPath(client.photoStorageKey, client.photoMimeType);
  if (!filePath) return new Response(null, { status: 404 });

  try {
    const photo = await readFile(filePath);
    return new Response(photo, {
      headers: {
        "Content-Type": client.photoMimeType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
