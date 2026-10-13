import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const fileExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export const venueFileDirectory = join(process.cwd(), "storage", "venue-files");

export function getVenueFilePath(key: string, mimeType: string) {
  const extension = fileExtensions[mimeType];
  if (!extension || !/^[0-9a-f-]{36}$/i.test(key)) return null;
  return join(venueFileDirectory, `${key}.${extension}`);
}

export async function ensureVenueFileDirectory() {
  await mkdir(venueFileDirectory, { recursive: true, mode: 0o700 });
}

export async function removeVenueFile(key: string, mimeType: string) {
  const filePath = getVenueFilePath(key, mimeType);
  if (filePath) await rm(filePath, { force: true });
}
