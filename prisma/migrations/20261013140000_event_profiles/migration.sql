ALTER TABLE "Client" ADD COLUMN "djepId" TEXT;
ALTER TABLE "Venue" ADD COLUMN "djepId" TEXT, ADD COLUMN "timezone" TEXT;
ALTER TABLE "Staff" ADD COLUMN "djepId" TEXT;
ALTER TABLE "Service" ADD COLUMN "djepId" TEXT;
ALTER TABLE "StaffAssignment" ADD COLUMN "fee" DECIMAL(65,30) DEFAULT 0;
ALTER TABLE "EventService" ADD COLUMN "bookedFee" DECIMAL(65,30) DEFAULT 0;
ALTER TABLE "Event"
  ADD COLUMN "eventDate" DATE,
  ADD COLUMN "startTime" TEXT,
  ADD COLUMN "endTime" TEXT,
  ADD COLUMN "setupTime" TEXT,
  ADD COLUMN "endNextDay" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sourceId" TEXT,
  ADD COLUMN "guestCount" TEXT,
  ADD COLUMN "details" JSONB DEFAULT '{}',
  ADD COLUMN "planning" JSONB DEFAULT '{}',
  ADD COLUMN "importIssues" JSONB DEFAULT '[]',
  ADD COLUMN "secondVenueId" TEXT,
  ALTER COLUMN "startDateTime" DROP NOT NULL,
  ALTER COLUMN "endDateTime" DROP NOT NULL;
UPDATE "Event" SET
  "eventDate" = ("startDateTime" AT TIME ZONE 'UTC' AT TIME ZONE "timezone")::date,
  "startTime" = to_char("startDateTime" AT TIME ZONE 'UTC' AT TIME ZONE "timezone", 'HH24:MI'),
  "endTime" = to_char("endDateTime" AT TIME ZONE 'UTC' AT TIME ZONE "timezone", 'HH24:MI'),
  "endNextDay" = ("endDateTime" AT TIME ZONE 'UTC' AT TIME ZONE "timezone")::date > ("startDateTime" AT TIME ZONE 'UTC' AT TIME ZONE "timezone")::date;
ALTER TABLE "Event" ALTER COLUMN "eventDate" SET NOT NULL;
CREATE UNIQUE INDEX "Event_organizationId_sourceId_key" ON "Event"("organizationId", "sourceId");
CREATE INDEX "Event_organizationId_eventDate_idx" ON "Event"("organizationId", "eventDate");
ALTER TABLE "Event" ADD CONSTRAINT "Event_secondVenueId_fkey" FOREIGN KEY ("secondVenueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
