import { readFile } from "node:fs/promises";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getVenueFilePath } from "@/lib/venue-file-storage";

export async function GET(_request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return new Response(null, { status: 404 });

  const { fileId } = await params;
  const file = await prisma.venueFile.findUnique({
    where: { id: fileId },
    include: { venue: { select: { organizationId: true } } },
  });
  if (!file || (session.user.organizationId && file.venue.organizationId !== session.user.organizationId)) {
    return new Response(null, { status: 404 });
  }

  const filePath = getVenueFilePath(file.storageKey, file.mimeType);
  if (!filePath) return new Response(null, { status: 404 });

  try {
    const bytes = await readFile(filePath);
    const disposition = file.mimeType.startsWith("image/") ? "inline" : "attachment";
    return new Response(bytes, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
