CREATE TABLE "VenueFile" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VenueFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VenueFile_storageKey_key" ON "VenueFile"("storageKey");
CREATE INDEX "VenueFile_venueId_createdAt_idx" ON "VenueFile"("venueId", "createdAt");

ALTER TABLE "VenueFile" ADD CONSTRAINT "VenueFile_venueId_fkey"
FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
