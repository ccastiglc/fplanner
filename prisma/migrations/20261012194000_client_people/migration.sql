CREATE TABLE "ClientPerson" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'client',
    "email" TEXT,
    "phone" TEXT,
    "phoneType" TEXT DEFAULT 'mobile',
    "photoUrl" TEXT,
    "photoStorageKey" TEXT,
    "photoMimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClientPerson_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientAdditionalContact" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClientAdditionalContact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientPerson_photoStorageKey_key" ON "ClientPerson"("photoStorageKey");
CREATE INDEX "ClientPerson_clientId_idx" ON "ClientPerson"("clientId");
CREATE INDEX "ClientAdditionalContact_clientId_idx" ON "ClientAdditionalContact"("clientId");

ALTER TABLE "ClientPerson" ADD CONSTRAINT "ClientPerson_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientAdditionalContact" ADD CONSTRAINT "ClientAdditionalContact_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
