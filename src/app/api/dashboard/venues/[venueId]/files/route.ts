import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { detectImage } from "@/lib/detect-image";
import { ensureVenueFileDirectory, getVenueFilePath, removeVenueFile } from "@/lib/venue-file-storage";

const maxFileSize = 10 * 1024 * 1024;
const maxFilesPerVenue = 50;

function detectFileType(buffer: Buffer) {
  if (buffer.toString("ascii", 0, 5) === "%PDF-") return "application/pdf";
  return detectImage(buffer);
}

function safeFileName(value: string) {
  return Array.from(value, (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127 || "/\\".includes(character) ? "_" : character).join("").trim().slice(0, 180) || "upload";
}

export async function POST(request: Request, { params }: { params: Promise<{ venueId: string }> }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { venueId } = await params;
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, ...(session.user.organizationId ? { organizationId: session.user.organizationId } : {}) },
    select: { id: true },
  });
  if (!venue) return Response.json({ error: "Venue not found" }, { status: 404 });

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxFileSize + 128 * 1024) return Response.json({ error: "File exceeds the 10 MB limit" }, { status: 413 });

  const formData = await request.formData();
  const upload = formData.get("file");
  if (!(upload instanceof File) || upload.size === 0) return Response.json({ error: "Select a PDF or image to upload" }, { status: 400 });
  if (upload.size > maxFileSize) return Response.json({ error: "File exceeds the 10 MB limit" }, { status: 413 });

  const existingCount = await prisma.venueFile.count({ where: { venueId: venue.id } });
  if (existingCount >= maxFilesPerVenue) return Response.json({ error: "This venue has reached the 50-file limit" }, { status: 400 });

  const buffer = Buffer.from(await upload.arrayBuffer());
  const mimeType = detectFileType(buffer);
  if (!mimeType) return Response.json({ error: "Upload a PDF, JPEG, PNG, or WebP file" }, { status: 415 });

  const storageKey = randomUUID();
  const filePath = getVenueFilePath(storageKey, mimeType);
  if (!filePath) return Response.json({ error: "Invalid file type" }, { status: 415 });

  await ensureVenueFileDirectory();
  await writeFile(filePath, buffer, { flag: "wx", mode: 0o600 });

  try {
    const file = await prisma.venueFile.create({
      data: { venueId: venue.id, originalName: safeFileName(upload.name), storageKey, mimeType, size: buffer.length },
      select: { id: true },
    });
    revalidatePath(`/dashboard/venues/${venue.id}`);
    return Response.json({ id: file.id });
  } catch (error) {
    await removeVenueFile(storageKey, mimeType);
    throw error;
  }
}
