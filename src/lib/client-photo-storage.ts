import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const photoExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const clientPhotoDirectory = join(process.cwd(), "storage", "client-photos");

export function getClientPhotoPath(key: string, mimeType: string) {
  const extension = photoExtensions[mimeType];

  if (!extension || !/^[0-9a-f-]{36}$/i.test(key)) return null;

  return join(clientPhotoDirectory, `${key}.${extension}`);
}

export async function ensureClientPhotoDirectory() {
  await mkdir(clientPhotoDirectory, { recursive: true, mode: 0o700 });
}

export async function removeClientPhoto(key: string, mimeType: string) {
  const filePath = getClientPhotoPath(key, mimeType);
  if (filePath) await rm(filePath, { force: true });
}
