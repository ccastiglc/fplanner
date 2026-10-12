ALTER TABLE "Client"
ADD COLUMN "role" TEXT NOT NULL DEFAULT 'client',
ADD COLUMN "phoneType" TEXT DEFAULT 'mobile',
ADD COLUMN "notes" TEXT,
ADD COLUMN "photoUrl" TEXT,
ADD COLUMN "photoStorageKey" TEXT,
ADD COLUMN "photoMimeType" TEXT;

CREATE UNIQUE INDEX "Client_photoStorageKey_key" ON "Client"("photoStorageKey");
