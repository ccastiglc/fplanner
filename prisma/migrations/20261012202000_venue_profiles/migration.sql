ALTER TABLE "Venue"
ADD COLUMN "externalId" TEXT,
ADD COLUMN "address2" TEXT,
ADD COLUMN "telephone" TEXT,
ADD COLUMN "faxPhone" TEXT,
ADD COLUMN "cellPhone" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "manager" TEXT,
ADD COLUMN "directions" TEXT,
ADD COLUMN "comments" TEXT,
ADD COLUMN "xmlInfo" TEXT,
ADD COLUMN "category" TEXT,
ADD COLUMN "distance" TEXT,
ADD COLUMN "travelTime" TEXT,
ADD COLUMN "travelFee" TEXT,
ADD COLUMN "setupFee" TEXT,
ADD COLUMN "taxRate" TEXT,
ADD COLUMN "needsApproval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "excludeFromInfoForm" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "oneTimeVenue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "profileImageUrl" TEXT;

CREATE TABLE "VenueContact" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "position" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VenueContact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VenueContact_venueId_idx" ON "VenueContact"("venueId");

ALTER TABLE "VenueContact" ADD CONSTRAINT "VenueContact_venueId_fkey"
FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
