ALTER TABLE "Client" ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE "OrganizationSettings"
ADD COLUMN "businessPhone" TEXT,
ADD COLUMN "businessEmail" TEXT,
ADD COLUMN "businessWebsite" TEXT,
ADD COLUMN "brandAccentColor" TEXT NOT NULL DEFAULT '#FF6B00';
